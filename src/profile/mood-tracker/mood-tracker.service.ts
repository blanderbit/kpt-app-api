import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { MoodTracker } from './entities/mood-tracker.entity';
import { MoodSurvey } from './entities/mood-survey.entity';
import { CreateMoodTrackerDto, UpdateMoodTrackerDto, MoodTrackerResponseDto } from './dto/mood-tracker.dto';
import { MoodTypesService } from '../../core/mood-types';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/error-codes';
import { LanguageService } from '../../admin/languages/services/language.service';

/** Get nested value by dot path, e.g. "mood_types.good.name" */
function getValueByPath(obj: Record<string, any>, pathKey: string): string | undefined {
  if (!obj || typeof pathKey !== 'string') return undefined;
  const parts = pathKey.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

/** Resolve a string that may be a translation key into the translated text */
function resolveMoodText(value: string, translations: Record<string, any> | null): string {
  if (!value || typeof value !== 'string') return value || '';
  if (!translations) return value;
  const key = value.trim();
  if (!key.includes('.')) return value;
  const resolved = getValueByPath(translations, key);
  return resolved !== undefined ? resolved : value;
}

@Injectable()
export class MoodTrackerService {
  constructor(
    @InjectRepository(MoodTracker)
    private readonly moodTrackerRepository: Repository<MoodTracker>,
    @InjectRepository(MoodSurvey)
    private readonly moodSurveyRepository: Repository<MoodSurvey>,
    private readonly moodTypesService: MoodTypesService,
    private readonly languageService: LanguageService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Set mood for the day (only once per day)
   */
  @Transactional()
  async setMoodForDay(createMoodTrackerDto: CreateMoodTrackerDto): Promise<MoodTrackerResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if mood is already set for today
    const existingMood = await this.moodTrackerRepository.findOne({
      where: {
        moodDate: today,
      },
    });

    if (existingMood) {
      throw AppException.conflict(
        ErrorCode.PROFILE_MOOD_ALREADY_EXISTS,
        'Mood for today is already set. You can update the existing record.',
        { date: today }
      );
    }

    // Validate mood type
    if (!this.moodTypesService.isValidMoodTypeId(createMoodTrackerDto.moodType)) {
      throw AppException.validation(
        ErrorCode.PROFILE_MOOD_INVALID_TYPE,
        'Invalid mood type provided',
        { moodType: createMoodTrackerDto.moodType }
      );
    }

    const moodTracker = this.moodTrackerRepository.create({
      moodType: createMoodTrackerDto.moodType,
      notes: createMoodTrackerDto.notes,
      moodDate: today,
    });

    // Load surveys if they are specified
    if (createMoodTrackerDto.moodSurveyIds && createMoodTrackerDto.moodSurveyIds.length > 0) {
      const moodSurveys = await this.moodSurveyRepository.findBy({
        id: In(createMoodTrackerDto.moodSurveyIds)
      });
      moodTracker.moodSurveys = moodSurveys;
    }

    const savedMoodTracker = await this.moodTrackerRepository.save(moodTracker);
    return this.mapToResponseDto(savedMoodTracker);
  }

  /**
   * Update mood for the day
   */
  @Transactional()
  async updateMoodForDay(
    moodDate: Date,
    updateMoodTrackerDto: UpdateMoodTrackerDto,
  ): Promise<MoodTrackerResponseDto> {
    const date = new Date(moodDate);
    date.setHours(0, 0, 0, 0);

    const moodTracker = await this.moodTrackerRepository.findOne({
      where: { moodDate: date },
    });

    if (!moodTracker) {
      throw AppException.notFound(
        ErrorCode.PROFILE_MOOD_NOT_FOUND,
        'Mood for the specified date not found',
        { date: moodDate }
      );
    }

    // Validate mood type if it's being changed
    if (updateMoodTrackerDto.moodType && !this.moodTypesService.isValidMoodTypeId(updateMoodTrackerDto.moodType)) {
      throw AppException.validation(
        ErrorCode.PROFILE_MOOD_INVALID_TYPE,
        'Invalid mood type provided',
        { moodType: updateMoodTrackerDto.moodType }
      );
    }

    // Update main fields
    if (updateMoodTrackerDto.moodType) {
      moodTracker.moodType = updateMoodTrackerDto.moodType;
    }
    if (updateMoodTrackerDto.notes !== undefined) {
      moodTracker.notes = updateMoodTrackerDto.notes;
    }

    // Update surveys if they are specified
    if (updateMoodTrackerDto.moodSurveyIds !== undefined) {
      if (updateMoodTrackerDto.moodSurveyIds.length > 0) {
        const moodSurveys = await this.moodSurveyRepository.findBy({
          id: In(updateMoodTrackerDto.moodSurveyIds)
        });
        moodTracker.moodSurveys = moodSurveys;
      } else {
        moodTracker.moodSurveys = [];
      }
    }

    const updatedMoodTracker = await this.moodTrackerRepository.save(moodTracker);
    
    return this.mapToResponseDto(updatedMoodTracker);
  }

  /**
   * Get mood for a specific date
   */
  async getMoodForDate(moodDate: Date): Promise<MoodTrackerResponseDto | null> {
    const date = new Date(moodDate);
    date.setHours(0, 0, 0, 0);

    const moodTracker = await this.moodTrackerRepository.findOne({
      where: { moodDate: date },
      relations: ['moodSurveys'],
    });

    return moodTracker ? this.mapToResponseDto(moodTracker) : null;
  }

  /**
   * Get mood for the last 7 days for the given user. Optional lang resolves mood_types.* keys via LanguageService.
   */
  async getMoodForLast7Days(userId: number, lang?: string): Promise<MoodTrackerResponseDto[]> {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const moodTrackers = await this.moodTrackerRepository
      .createQueryBuilder('moodTracker')
      .leftJoinAndSelect('moodTracker.moodSurveys', 'moodSurveys')
      .where('moodTracker.userId = :userId', { userId })
      .andWhere('moodTracker.moodDate >= :startDate', { startDate })
      .andWhere('moodTracker.moodDate <= :endDate', { endDate })
      .orderBy('moodTracker.moodDate', 'ASC')
      .getMany();

    const code = (lang?.trim() || 'en').toLowerCase().replace('_', '-');
    const translations = this.languageService.getTranslationsByCode(code)
      ?? this.languageService.getTranslationsByCode('en');
    return moodTrackers.map(moodTracker => this.mapToResponseDto(moodTracker, translations));
  }

  /**
   * Get mood for a period
   */
  async getMoodForPeriod(startDate: Date, endDate: Date): Promise<MoodTrackerResponseDto[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const moodTrackers = await this.moodTrackerRepository
      .createQueryBuilder('moodTracker')
      .leftJoinAndSelect('moodTracker.moodSurveys', 'moodSurveys')
      .where('moodTracker.moodDate >= :startDate', { startDate: start })
      .andWhere('moodTracker.moodDate <= :endDate', { endDate: end })
      .orderBy('moodTracker.moodDate', 'ASC')
      .getMany();

    return moodTrackers.map(moodTracker => this.mapToResponseDto(moodTracker));
  }

  /**
   * Get mood statistics for a period
   */
  async getMoodStatsForPeriod(startDate: Date, endDate: Date): Promise<{
    totalDays: number;
    trackedDays: number;
    averageScore: number;
    moodDistribution: Record<string, number>;
    categoryDistribution: Record<string, number>;
  }> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const moodTrackers = await this.moodTrackerRepository
      .createQueryBuilder('moodTracker')
      .leftJoinAndSelect('moodTracker.moodSurveys', 'moodSurveys')
      .where('moodTracker.moodDate >= :startDate', { startDate: start })
      .andWhere('moodTracker.moodDate <= :endDate', { endDate: end })
      .getMany();

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const trackedDays = moodTrackers.length;

    let totalScore = 0;
    const moodDistribution: Record<string, number> = {};
    const categoryDistribution: Record<string, number> = {};

    moodTrackers.forEach(moodTracker => {
      const moodType = this.moodTypesService.getMoodTypeById(moodTracker.moodType);
      if (moodType) {
        totalScore += moodType.score;
        
        // Distribution by mood types
        moodDistribution[moodTracker.moodType] = (moodDistribution[moodTracker.moodType] || 0) + 1;
        
        // Distribution by categories
        categoryDistribution[moodType.category] = (categoryDistribution[moodType.category] || 0) + 1;
      }
    });

    const averageScore = trackedDays > 0 ? totalScore / trackedDays : 0;

    return {
      totalDays,
      trackedDays,
      averageScore: Math.round(averageScore * 100) / 100,
      moodDistribution,
      categoryDistribution,
    };
  }

  /**
   * Get all mood records
   */
  async getAllMoodTrackers(): Promise<MoodTrackerResponseDto[]> {
    const moodTrackers = await this.moodTrackerRepository
      .createQueryBuilder('moodTracker')
      .leftJoinAndSelect('moodTracker.moodSurveys', 'moodSurveys')
      .orderBy('moodTracker.moodDate', 'DESC')
      .getMany();

    return moodTrackers.map(moodTracker => this.mapToResponseDto(moodTracker));
  }

  /**
   * Delete mood for a specific date
   */
  @Transactional()
  async deleteMoodForDate(moodDate: Date): Promise<void> {
    const date = new Date(moodDate);
    date.setHours(0, 0, 0, 0);

    const moodTracker = await this.moodTrackerRepository.findOne({
      where: { moodDate: date },
    });

    if (!moodTracker) {
      throw AppException.notFound(
        ErrorCode.PROFILE_MOOD_NOT_FOUND,
        'Mood for the specified date not found',
        { date: moodDate }
      );
    }

    await this.moodTrackerRepository.remove(moodTracker);
  }

  /**
   * Get current mood (for today)
   */
  async getCurrentMood(): Promise<MoodTrackerResponseDto | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const moodTracker = await this.moodTrackerRepository.findOne({
      where: { moodDate: today },
      relations: ['moodSurveys'],
    });

    return moodTracker ? this.mapToResponseDto(moodTracker) : null;
  }

  /**
   * Convert MoodTracker to ResponseDto. If translations are provided, mood_types.* keys in
   * moodTypeDetails (name, description, category) are resolved to localized strings.
   */
  private mapToResponseDto(
    moodTracker: MoodTracker,
    translations?: Record<string, any> | null,
  ): MoodTrackerResponseDto {
    const moodType = this.moodTypesService.getMoodTypeById(moodTracker.moodType);
    let moodTypeDetails: MoodTrackerResponseDto['moodTypeDetails'] = moodType
      ? { ...moodType }
      : null;

    if (moodTypeDetails && translations) {
      const categoryKey = moodType!.category
        ? `mood_types.categories.${moodType!.category}`
        : null;
      moodTypeDetails = {
        ...moodTypeDetails,
        name: resolveMoodText(moodType!.name, translations),
        description: resolveMoodText(moodType!.description, translations),
        ...(categoryKey && {
          categoryLabel: resolveMoodText(categoryKey, translations),
        }),
      };
    }

    return {
      id: moodTracker.id,
      moodType: moodTracker.moodType,
      moodTypeDetails,
      notes: moodTracker.notes,
      moodDate: moodTracker.moodDate,
      moodSurveys: moodTracker.moodSurveys || [],
      createdAt: moodTracker.createdAt,
      updatedAt: moodTracker.updatedAt,
    };
  }
}
