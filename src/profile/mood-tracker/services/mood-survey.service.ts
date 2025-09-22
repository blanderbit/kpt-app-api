import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoodSurvey } from '../entities/mood-survey.entity';
import { MoodSurveyResponseDto } from '../dto/mood-survey.dto';
import { AppException } from '../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../common/error-codes';

@Injectable()
export class MoodSurveyService {
  private readonly logger = new Logger(MoodSurveyService.name);

  constructor(
    @InjectRepository(MoodSurvey)
    private readonly moodSurveyRepository: Repository<MoodSurvey>,
  ) {}

  /**
   * Get all active mood surveys
   */
  async getAllActiveMoodSurveys(): Promise<MoodSurveyResponseDto[]> {
    try {
      const surveys = await this.moodSurveyRepository.find({
        where: { isArchived: false },
        order: { createdAt: 'DESC' },
      });

      return surveys.map(survey => this.mapToResponseDto(survey));
    } catch (error) {
      this.logger.error('Failed to get active mood surveys:', error);
      throw AppException.internal(ErrorCode.PROFILE_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getAllActiveMoodSurveys',
      });
    }
  }

  /**
   * Get active mood survey by ID
   */
  async getActiveMoodSurveyById(id: number): Promise<MoodSurveyResponseDto> {
    try {
      const survey = await this.moodSurveyRepository.findOne({
        where: { id, isArchived: false },
      });

      if (!survey) {
        throw AppException.notFound(ErrorCode.PROFILE_MOOD_SURVEY_NOT_FOUND, 'Mood survey not found or archived');
      }

      return this.mapToResponseDto(survey);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to get active mood survey by ID:', error);
      throw AppException.internal(ErrorCode.PROFILE_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getActiveMoodSurveyById',
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
