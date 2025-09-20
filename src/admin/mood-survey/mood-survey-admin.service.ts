import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { MoodSurvey } from '../../profile/mood-tracker/entities/mood-survey.entity';
import {
  CreateMoodSurveyDto,
  UpdateMoodSurveyDto,
  MoodSurveyResponseDto,
} from '../../profile/mood-tracker/dto/mood-survey.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/error-codes';

@Injectable()
export class MoodSurveyAdminService {
  private readonly logger = new Logger(MoodSurveyAdminService.name);

  constructor(
    @InjectRepository(MoodSurvey)
    private readonly moodSurveyRepository: Repository<MoodSurvey>,
  ) {}

  /**
   * Create new mood survey
   */
  @Transactional()
  async createMoodSurvey(
    createMoodSurveyDto: CreateMoodSurveyDto,
    createdBy: string,
  ): Promise<MoodSurveyResponseDto> {
    try {
      const moodSurvey = this.moodSurveyRepository.create({
        ...createMoodSurveyDto,
        createdBy,
        updatedBy: createdBy,
      });

      const savedMoodSurvey = await this.moodSurveyRepository.save(moodSurvey);
      this.logger.log(`Mood survey created with ID: ${savedMoodSurvey.id}`);

      return this.mapToResponseDto(savedMoodSurvey);
    } catch (error) {
      this.logger.error('Failed to create mood survey:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'createMoodSurvey',
      });
    }
  }

  /**
   * Get all mood surveys
   */
  async getAllMoodSurveys(
    includeArchived?: boolean,
  ): Promise<MoodSurveyResponseDto[]> {
    try {
      const query = this.moodSurveyRepository.createQueryBuilder('survey');

      if (!includeArchived) {
        query.andWhere('survey.isArchived = :isArchived', { isArchived: false });
      }

      query.orderBy('survey.createdAt', 'DESC');

      const surveys = await query.getMany();
      return surveys.map(survey => this.mapToResponseDto(survey));
    } catch (error) {
      this.logger.error('Failed to get mood surveys:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getAllMoodSurveys',
      });
    }
  }

  /**
   * Get mood survey by ID
   */
  async getMoodSurveyById(id: number): Promise<MoodSurveyResponseDto> {
    try {
      const survey = await this.moodSurveyRepository.findOne({ where: { id } });

      if (!survey) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Mood survey not found');
      }

      return this.mapToResponseDto(survey);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to get mood survey by ID:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getMoodSurveyById',
        surveyId: id,
      });
    }
  }

  /**
   * Update mood survey
   */
  @Transactional()
  async updateMoodSurvey(
    id: number,
    updateMoodSurveyDto: UpdateMoodSurveyDto,
    updatedBy: string,
  ): Promise<MoodSurveyResponseDto> {
    try {
      const survey = await this.moodSurveyRepository.findOne({ where: { id } });

      if (!survey) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Mood survey not found');
      }

      if (survey.isArchived) {
        throw AppException.validation(
          ErrorCode.ADMIN_INTERNAL_SERVER_ERROR,
          'Cannot update archived mood survey'
        );
      }

      Object.assign(survey, updateMoodSurveyDto, { updatedBy });
      const updatedSurvey = await this.moodSurveyRepository.save(survey);

      this.logger.log(`Mood survey updated with ID: ${updatedSurvey.id}`);
      return this.mapToResponseDto(updatedSurvey);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to update mood survey:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'updateMoodSurvey',
        surveyId: id,
      });
    }
  }

  /**
   * Archive mood survey
   */
  @Transactional()
  async archiveMoodSurvey(
    id: number,
    archivedBy: string,
    reason?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const survey = await this.moodSurveyRepository.findOne({ where: { id } });

      if (!survey) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Mood survey not found');
      }

      if (survey.isArchived) {
        return { success: false, message: 'Mood survey is already archived' };
      }

      survey.isArchived = true;
      survey.archivedAt = new Date();
      survey.archivedBy = archivedBy;
      survey.updatedBy = archivedBy;

      await this.moodSurveyRepository.save(survey);

      this.logger.log(`Mood survey archived with ID: ${id}, reason: ${reason || 'Not specified'}`);
      return { success: true, message: 'Mood survey archived successfully' };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to archive mood survey:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'archiveMoodSurvey',
        surveyId: id,
      });
    }
  }

  /**
   * Restore archived mood survey
   */
  @Transactional()
  async restoreMoodSurvey(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const survey = await this.moodSurveyRepository.findOne({ where: { id } });

      if (!survey) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Mood survey not found');
      }

      if (!survey.isArchived) {
        return { success: false, message: 'Mood survey is not archived' };
      }

      survey.isArchived = false;
      survey.archivedAt = null;
      survey.archivedBy = null;

      await this.moodSurveyRepository.save(survey);

      this.logger.log(`Mood survey restored with ID: ${id}`);
      return { success: true, message: 'Mood survey restored successfully' };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to restore mood survey:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'restoreMoodSurvey',
        surveyId: id,
      });
    }
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(survey: MoodSurvey): MoodSurveyResponseDto {
    return {
      id: survey.id,
      title: survey.title,
      isArchived: survey.isArchived,
      createdBy: survey.createdBy,
      updatedBy: survey.updatedBy,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
      archivedAt: survey.archivedAt,
      archivedBy: survey.archivedBy,
    };
  }
}
