import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Survey, SurveyStatus } from './entities/survey.entity';
import { UserSurvey } from './entities/user-survey.entity';
import { UserTemporarySurvey } from '../settings/entities/user-temporary-survey.entity';
import { SubmitSurveyAnswerDto, SurveyResponseDto } from './dto/survey.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/error-codes';

@Injectable()
export class SurveyPublicService {
  private readonly logger = new Logger(SurveyPublicService.name);

  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    @InjectRepository(UserSurvey)
    private readonly userSurveyRepository: Repository<UserSurvey>,
    @InjectRepository(UserTemporarySurvey)
    private readonly userTemporarySurveyRepository: Repository<UserTemporarySurvey>,
  ) {}

  /**
   * Get survey by ID (public, only non-archived)
   */
  async getSurveyById(id: number, userId?: number): Promise<SurveyResponseDto> {
    try {
      const survey = await this.surveyRepository.findOne({
        where: { id, status: SurveyStatus.ACTIVE },
        relations: ['files'],
      });

      if (!survey) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Survey not found or archived');
      }

      const response = this.mapToResponseDto(survey);

      // Check if user has completed this survey
      if (userId) {
        const userSurvey = await this.userSurveyRepository.findOne({
          where: { userId, surveyId: id },
        });
        response.isCompleted = !!userSurvey;
      }

      return response;
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
   * Get random survey
   */
  async getRandomSurvey(userId?: number): Promise<SurveyResponseDto[]> {
    try {
      const temporarySurveys = await this.userTemporarySurveyRepository
        .createQueryBuilder('userTemporarySurvey')
        .leftJoinAndSelect('userTemporarySurvey.survey', 'survey')
        .leftJoinAndSelect('survey.files', 'files')
        // .where('userTemporarySurvey.user_id = :userId', { userId })
        // .andWhere('survey.status = :status', { status: SurveyStatus.ACTIVE })
        // .andWhere(
        //   '(userTemporarySurvey.expiresAt IS NULL OR userTemporarySurvey.expiresAt > :now)',
        //   { now: new Date() },
        // )
        // .andWhere(
        //   'NOT EXISTS (SELECT 1 FROM user_surveys WHERE user_surveys.survey_id = survey.id AND user_surveys.user_id = :userId)',
        //   { userId },
        // )
        .orderBy('RAND()')
        .getMany();

      return temporarySurveys.map(ts => this.mapToResponseDto(ts.survey));
    } catch (error) {
      this.logger.error('Failed to get random survey:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getRandomSurvey',
      });
    }
  }

  /**
   * Get all active surveys with pagination
   */
  async getActiveSurveys(userId?: number): Promise<SurveyResponseDto[]> {
    try {
      const surveys = await this.surveyRepository.find({
        where: { status: SurveyStatus.ACTIVE },
        relations: ['files'],
        order: { createdAt: 'DESC' },
      });

      const responses = surveys.map(survey => this.mapToResponseDto(survey));

      // Check which surveys the user has completed
      if (userId) {
        const userSurveys = await this.userSurveyRepository.find({
          where: { userId },
        });

        const completedSurveyIds = new Set(
          userSurveys.map(us => us.surveyId)
        );

        responses.forEach(survey => {
          survey.isCompleted = completedSurveyIds.has(survey.id);
        });
      }

      return responses;
    } catch (error) {
      this.logger.error('Failed to get active surveys:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getActiveSurveys',
      });
    }
  }

  /**
   * Submit answer to survey
   */
  @Transactional()
  async submitSurveyAnswer(
    surveyId: number,
    userId: number,
    submitAnswerDto: SubmitSurveyAnswerDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if survey exists and is not archived
      const survey = await this.surveyRepository.findOne({
        where: { id: surveyId, status: SurveyStatus.ACTIVE },
      });

      if (!survey) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Survey not found or inactive');
      }

      // Check if user already submitted an answer
      let userSurvey = await this.userSurveyRepository.findOne({
        where: { userId, surveyId },
      });

      if (userSurvey) {
        // Update existing answer
        userSurvey.answers = submitAnswerDto.answers as object;
        await this.userSurveyRepository.save(userSurvey);
        
        this.logger.log(`Survey answer updated for user ${userId}, survey ${surveyId}`);
        return { success: true, message: 'Survey answer updated successfully' };
      } else {
        // Create new answer
        userSurvey = this.userSurveyRepository.create({
          userId,
          surveyId,
          answers: submitAnswerDto.answers as object,
        });
        
        await this.userSurveyRepository.save(userSurvey);
        
        this.logger.log(`Survey answer submitted for user ${userId}, survey ${surveyId}`);
        return { success: true, message: 'Survey answer submitted successfully' };
      }
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to submit survey answer:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'submitSurveyAnswer',
        surveyId,
        userId,
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
      file:null
      //  file
      //   ? {
      //       id: file.id,
      //       fileUrl: file.fileUrl,
      //       fileKey: file.fileKey,
      //       fileName: file.fileName,
      //       mimeType: file.mimeType,
      //       size: file.size,
      //     }
      //   : null,
    };
  }
}

