import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { PaginateQuery, paginate, Paginated } from 'nestjs-paginate';
import { Survey, SurveyStatus } from './entities/survey.entity';
import {
  CreateSurveyDto,
  UpdateSurveyDto,
  SurveyResponseDto,
  SurveyStatisticsDto,
  SurveyQuestionStatisticDto,
  SurveyAnswerStatisticDto,
} from './dto/survey.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/error-codes';
import { surveyConfig } from './survey.config';
import { UserSurvey } from './entities/user-survey.entity';
import { UserTemporarySurvey } from '../settings/entities/user-temporary-survey.entity';
import { File } from '../../common/entities/file.entity';
import { FileUploadService } from '../../core/file-upload';

@Injectable()
export class SurveyAdminService {
  private readonly logger = new Logger(SurveyAdminService.name);

  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    @InjectRepository(UserSurvey)
    private readonly userSurveyRepository: Repository<UserSurvey>,
    @InjectRepository(UserTemporarySurvey)
    private readonly userTemporarySurveyRepository: Repository<UserTemporarySurvey>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  /**
   * Create new survey
   */
  @Transactional()
  async createSurvey(
    createSurveyDto: CreateSurveyDto,
    createdBy: string,
    file?: Express.Multer.File,
  ): Promise<SurveyResponseDto> {
    try {
      const survey = this.surveyRepository.create({
        title: createSurveyDto.title,
        description: createSurveyDto.description,
        questions: createSurveyDto.questions,
        language: createSurveyDto.language,
        status: SurveyStatus.AVAILABLE,
        createdBy,
        updatedBy: createdBy,
      });

      const savedSurvey = await this.surveyRepository.save(survey);

      if (file) {
        const surveyFile = this.fileRepository.create({
          fileName: file.originalname,
          fileUrl: '',
          fileKey: '',
          mimeType: file.mimetype,
          size: file.size,
          entityType: 'survey',
          entityId: savedSurvey.id,
          surveyId: savedSurvey.id,
        });

        await this.fileRepository.save(surveyFile);
      }

      this.logger.log(`Survey created with ID: ${savedSurvey.id}`);

      const reloaded = await this.surveyRepository.findOne({
        where: { id: savedSurvey.id },
        relations: ['files'],
      });

      return this.mapToResponseDto(reloaded ?? savedSurvey);
    } catch (error) {
      this.logger.error('Failed to create survey:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'createSurvey',
      });
    }
  }

  /**
   * Get surveys with pagination
   */
  async getSurveysPaginated(query: PaginateQuery): Promise<Paginated<Survey>> {
    return paginate(query, this.surveyRepository, surveyConfig);
  }

  /**
   * Get survey by ID
   */
  async getSurveyById(id: number): Promise<SurveyResponseDto> {
    try {
      const survey = await this.surveyRepository.findOne({ where: { id }, relations: ['files'] });

      if (!survey) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Survey not found');
      }

      return this.mapToResponseDto(survey);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to get survey by ID:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getSurveyById',
        surveyId: id,
      });
    }
  }

  /**
   * Update survey
   */
  @Transactional()
  async updateSurvey(
    id: number,
    updateSurveyDto: UpdateSurveyDto,
    updatedBy: string,
    file?: Express.Multer.File,
  ): Promise<SurveyResponseDto> {
    try {
      const survey = await this.surveyRepository.findOne({ where: { id }, relations: ['files'] });

      if (!survey) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Survey not found');
      }

      if (survey.status !== SurveyStatus.AVAILABLE) {
        throw AppException.validation(
          ErrorCode.ADMIN_INTERNAL_SERVER_ERROR,
          'Only surveys in "available" status can be updated'
        );
      }

      const { removeFileId, ...surveyPayload } = updateSurveyDto;

      if (removeFileId) {
        const fileToRemove = survey.files?.find((item) => item.id === removeFileId);
        if (fileToRemove) {
          await this.removeSurveyFile(fileToRemove);
          survey.files = (survey.files ?? []).filter((item) => item.id !== removeFileId);
        } else {
          this.logger.warn(`Survey ${id}: requested to remove missing file ${removeFileId}`);
        }
      }

      Object.assign(survey, surveyPayload, { updatedBy });
      const updatedSurvey = await this.surveyRepository.save(survey);

      if (file) {
        const surveyFile = this.fileRepository.create({
          fileName: file.originalname,
          fileUrl: '',
          fileKey: '',
          mimeType: file.mimetype,
          size: file.size,
          entityType: 'survey',
          entityId: updatedSurvey.id,
          surveyId: updatedSurvey.id,
        });

        const savedFile = await this.fileRepository.save(surveyFile);
        updatedSurvey.files = [...(updatedSurvey.files ?? []), savedFile];
      }

      this.logger.log(`Survey updated with ID: ${updatedSurvey.id}`);

      const reloaded = await this.surveyRepository.findOne({
        where: { id: updatedSurvey.id },
        relations: ['files'],
      });

      return this.mapToResponseDto(reloaded ?? updatedSurvey);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to update survey:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'updateSurvey',
        surveyId: id,
      });
    }
  }

  /**
   * Delete survey
   */
  @Transactional()
  async deleteSurvey(
    id: number,
    deletedBy: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const survey = await this.surveyRepository.findOne({ where: { id }, relations: ['files'] });

      if (!survey) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Survey not found');
      }

      if (survey.status === SurveyStatus.ACTIVE) {
        throw AppException.validation(
          ErrorCode.ADMIN_INTERNAL_SERVER_ERROR,
          'Active surveys cannot be deleted. Close the survey first.'
        );
      }

      if (survey.files && survey.files.length > 0) {
        for (const file of survey.files) {
          await this.removeSurveyFile(file);
        }
      }

      await this.surveyRepository.remove(survey);

      this.logger.log(`Survey deleted with ID: ${id}`);
      return { success: true, message: 'Survey deleted successfully' };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to delete survey:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'deleteSurvey',
        surveyId: id,
      });
    }
  }

  /**
   * Get detailed statistics for a survey
   */
  async getSurveyStatistics(id: number): Promise<SurveyStatisticsDto> {
    try {
      const survey = await this.surveyRepository.findOne({ where: { id } });

      if (!survey) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Survey not found');
      }

      if (survey.status === SurveyStatus.AVAILABLE) {
        throw AppException.validation(
          ErrorCode.ADMIN_INTERNAL_SERVER_ERROR,
          'Statistics are not available for surveys in "available" status'
        );
      }

      const [responses, activeAssignments, questionStats] = await Promise.all([
        this.userSurveyRepository.find({
          where: { surveyId: id },
          select: ['userId'],
        }),
        this.userTemporarySurveyRepository
          .createQueryBuilder('assignment')
          .where('assignment.surveyId = :surveyId', { surveyId: id })
          .andWhere('(assignment.expiresAt IS NULL OR assignment.expiresAt > :now)', { now: new Date() })
          .getCount(),
        this.buildQuestionStatistics(id, survey.questions ?? []),
      ]);

      const respondedUserIds = new Set(responses.map((response) => response.userId));
      return {
        surveyId: survey.id,
        title: survey.title,
        totalResponses: responses.length,
        respondedUsers: respondedUserIds.size,
        activeAssignments,
        questionStats,
      };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to get survey statistics:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getSurveyStatistics',
        surveyId: id,
      });
    }
  }

  /**
   * Close (archive) survey
   */
  @Transactional()
  async closeSurvey(id: number, archivedBy: string): Promise<SurveyResponseDto> {
    try {
      const survey = await this.surveyRepository.findOne({ where: { id }, relations: ['files'] });

      if (!survey) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Survey not found');
      }

      if (survey.status === SurveyStatus.ARCHIVED) {
        return this.mapToResponseDto(survey);
      }

      if (survey.status !== SurveyStatus.ACTIVE) {
        throw AppException.validation(
          ErrorCode.ADMIN_INTERNAL_SERVER_ERROR,
          'Only active surveys can be closed'
        );
      }

      survey.status = SurveyStatus.ARCHIVED;
      survey.archivedAt = new Date();
      survey.archivedBy = archivedBy;
      survey.updatedBy = archivedBy ?? survey.updatedBy;

      const updated = await this.surveyRepository.save(survey);
      return this.mapToResponseDto(updated);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to close survey:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'closeSurvey',
        surveyId: id,
      });
    }
  }

  /**
   * Duplicate survey
   */
  @Transactional()
  async duplicateSurvey(id: number, createdBy: string): Promise<SurveyResponseDto> {
    try {
      const survey = await this.surveyRepository.findOne({ where: { id }, relations: ['files'] });

      if (!survey) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Survey not found');
      }

      const duplicatedSurvey = this.surveyRepository.create({
        title: `${survey.title} (Copy)`,
        description: survey.description,
        questions: survey.questions
          ? survey.questions.map((question) => ({
              ...question,
              options: question.options?.map((option) => ({ ...option })) ?? [],
            }))
          : null,
        status: SurveyStatus.AVAILABLE,
        createdBy,
        updatedBy: createdBy,
      });

      const saved = await this.surveyRepository.save(duplicatedSurvey);
      const reloaded = await this.surveyRepository.findOne({
        where: { id: saved.id },
        relations: ['files'],
      });
      return this.mapToResponseDto(reloaded ?? saved);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to duplicate survey:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'duplicateSurvey',
        surveyId: id,
      });
    }
  }

  @Transactional()
  async activateSurvey(id: number, activatedBy: string): Promise<SurveyResponseDto> {
    try {
      const survey = await this.surveyRepository.findOne({ where: { id }, relations: ['files'] });

      if (!survey) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Survey not found');
      }

      if (survey.status === SurveyStatus.ACTIVE) {
        return this.mapToResponseDto(survey);
      }

      survey.status = SurveyStatus.ACTIVE;
      survey.archivedAt = null;
      survey.archivedBy = null;
      survey.updatedBy = activatedBy ?? survey.updatedBy;

      const updated = await this.surveyRepository.save(survey);

      const reloaded = await this.surveyRepository.findOne({
        where: { id: updated.id },
        relations: ['files'],
      });

      return this.mapToResponseDto(reloaded ?? updated);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to activate survey:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'activateSurvey',
        surveyId: id,
      });
    }
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(survey: Survey): SurveyResponseDto {
    const file = survey.files?.[0];

    return {
      id: survey.id,
      title: survey.title,
      description: survey.description,
      questions: survey.questions,
      status: survey.status,
      createdBy: survey.createdBy,
      updatedBy: survey.updatedBy,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
      archivedAt: survey.archivedAt,
      archivedBy: survey.archivedBy,
      files: file
        ? [
            {
              id: file.id,
              fileUrl: file.fileUrl,
              fileKey: file.fileKey,
              fileName: file.fileName,
              mimeType: file.mimeType,
              size: file.size,
            },
          ]
        : survey.files?.map((f) => ({
            id: f.id,
            fileUrl: f.fileUrl,
            fileKey: f.fileKey,
            fileName: f.fileName,
            mimeType: f.mimeType,
            size: f.size,
          })) || null,
    };
  }

  async updateFileUrls(file: { id: number }, url: string, key: string): Promise<void> {
    const fileRecord = await this.fileRepository.findOne({ where: { id: file.id } });
    if (!fileRecord) {
      return;
    }

    fileRecord.fileUrl = url;
    fileRecord.fileKey = key;
    await this.fileRepository.save(fileRecord);
  }

  private async removeSurveyFile(file: File): Promise<void> {
    try {
      if (file.fileKey) {
        await this.fileUploadService.deleteFile(file.fileKey);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to delete survey file from storage (id=${file.id}, key=${file.fileKey}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    await this.fileRepository.delete(file.id);
  }

  private async buildQuestionStatistics(
    surveyId: number,
    questions: Survey['questions'],
  ): Promise<SurveyQuestionStatisticDto[]> {
    if (!questions || questions.length === 0) {
      return [];
    }

    const submissions = await this.userSurveyRepository.find({
      select: ['answers'],
      where: { surveyId },
    });

    const countsByQuestion = new Map<string, Map<string, number>>();

    const pushCount = (questionId: string, value: string) => {
      const trimmed = value?.trim();
      if (!trimmed) {
        return;
      }

      const questionMap = countsByQuestion.get(questionId) ?? new Map<string, number>();
      questionMap.set(trimmed, (questionMap.get(trimmed) ?? 0) + 1);
      countsByQuestion.set(questionId, questionMap);
    };

    submissions.forEach((submission) => {
      const rawAnswers = submission.answers;
      if (!rawAnswers) {
        return;
      }

      const answersArray: Array<{ questionId?: string; answer?: unknown }> = Array.isArray(rawAnswers)
        ? rawAnswers
        : Object.entries(rawAnswers).map(([questionId, answer]) => ({ questionId, answer }));

      answersArray.forEach(({ questionId, answer }) => {
        if (!questionId) {
          return;
        }

        const values: string[] = Array.isArray(answer)
          ? (answer as unknown[]).map((item) => String(item))
          : typeof answer === 'object' && answer !== null
            ? Object.values(answer as Record<string, unknown>).map((item) => String(item))
            : [String(answer ?? '')];

        values.forEach((value) => pushCount(questionId, value));
      });
    });

    return questions.map((question) => {
      const optionLabels = new Map<string, string>();
      question.options?.forEach((option) => {
        optionLabels.set(option.id, option.text);
      });

      const questionCounts = Array.from(countsByQuestion.get(question.id)?.entries() ?? []).map(
        ([value, count]) => ({ value, count }),
      );

      const total = questionCounts.reduce((sum, entry) => sum + entry.count, 0) || 1;

      const answers = questionCounts
        .map((entry) => ({
          value: entry.value,
          label: optionLabels.get(entry.value) ?? entry.value,
          count: entry.count,
          percentage: Math.round((entry.count / total) * 1000) / 10,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        questionId: question.id,
        questionText: question.text,
        type: question.type,
        answers,
      };
    });
  }
}

