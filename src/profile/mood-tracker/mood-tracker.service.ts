import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoodTracker } from './entities/mood-tracker.entity';
import { CreateMoodTrackerDto, UpdateMoodTrackerDto, MoodTrackerResponseDto } from './dto/mood-tracker.dto';
import { MoodTypesService } from '../../core/mood-types';

@Injectable()
export class MoodTrackerService {
  constructor(
    @InjectRepository(MoodTracker)
    private readonly moodTrackerRepository: Repository<MoodTracker>,
    private readonly moodTypesService: MoodTypesService,
  ) {}

  /**
   * Указать настроение за день (только 1 раз в день)
   */
  async setMoodForDay(createMoodTrackerDto: CreateMoodTrackerDto): Promise<MoodTrackerResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Проверяем, есть ли уже настроение за сегодня
    const existingMood = await this.moodTrackerRepository.findOne({
      where: {
        moodDate: today,
      },
    });

    if (existingMood) {
      throw new ConflictException('Настроение за сегодня уже указано. Можно обновить существующую запись.');
    }

    // Валидируем тип настроения
    if (!this.moodTypesService.isValidMoodTypeId(createMoodTrackerDto.moodType)) {
      throw new NotFoundException('Неверный тип настроения');
    }

    const moodTracker = this.moodTrackerRepository.create({
      ...createMoodTrackerDto,
      moodDate: today,
    });

    const savedMoodTracker = await this.moodTrackerRepository.save(moodTracker);
    return this.mapToResponseDto(savedMoodTracker);
  }

  /**
   * Обновить настроение за день
   */
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
      throw new NotFoundException('Настроение за указанную дату не найдено');
    }

    // Валидируем тип настроения если он изменяется
    if (updateMoodTrackerDto.moodType && !this.moodTypesService.isValidMoodTypeId(updateMoodTrackerDto.moodType)) {
      throw new NotFoundException('Неверный тип настроения');
    }

    Object.assign(moodTracker, updateMoodTrackerDto);
    const updatedMoodTracker = await this.moodTrackerRepository.save(moodTracker);
    
    return this.mapToResponseDto(updatedMoodTracker);
  }

  /**
   * Получить настроение за конкретную дату
   */
  async getMoodForDate(moodDate: Date): Promise<MoodTrackerResponseDto | null> {
    const date = new Date(moodDate);
    date.setHours(0, 0, 0, 0);

    const moodTracker = await this.moodTrackerRepository.findOne({
      where: { moodDate: date },
    });

    return moodTracker ? this.mapToResponseDto(moodTracker) : null;
  }

  /**
   * Получить настроение за последние 7 дней
   */
  async getMoodForLast7Days(): Promise<MoodTrackerResponseDto[]> {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const moodTrackers = await this.moodTrackerRepository
      .createQueryBuilder('moodTracker')
      .where('moodTracker.moodDate >= :startDate', { startDate })
      .andWhere('moodTracker.moodDate <= :endDate', { endDate })
      .orderBy('moodTracker.moodDate', 'ASC')
      .getMany();

    return moodTrackers.map(moodTracker => this.mapToResponseDto(moodTracker));
  }

  /**
   * Получить настроение за период
   */
  async getMoodForPeriod(startDate: Date, endDate: Date): Promise<MoodTrackerResponseDto[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const moodTrackers = await this.moodTrackerRepository
      .createQueryBuilder('moodTracker')
      .where('moodTracker.moodDate >= :startDate', { startDate: start })
      .andWhere('moodTracker.moodDate <= :endDate', { endDate: end })
      .orderBy('moodTracker.moodDate', 'ASC')
      .getMany();

    return moodTrackers.map(moodTracker => this.mapToResponseDto(moodTracker));
  }

  /**
   * Получить статистику настроения за период
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
        
        // Распределение по типам настроения
        moodDistribution[moodTracker.moodType] = (moodDistribution[moodTracker.moodType] || 0) + 1;
        
        // Распределение по категориям
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
   * Получить все записи настроения
   */
  async getAllMoodTrackers(): Promise<MoodTrackerResponseDto[]> {
    const moodTrackers = await this.moodTrackerRepository
      .createQueryBuilder('moodTracker')
      .orderBy('moodTracker.moodDate', 'DESC')
      .getMany();

    return moodTrackers.map(moodTracker => this.mapToResponseDto(moodTracker));
  }

  /**
   * Удалить настроение за конкретную дату
   */
  async deleteMoodForDate(moodDate: Date): Promise<void> {
    const date = new Date(moodDate);
    date.setHours(0, 0, 0, 0);

    const moodTracker = await this.moodTrackerRepository.findOne({
      where: { moodDate: date },
    });

    if (!moodTracker) {
      throw new NotFoundException('Настроение за указанную дату не найдено');
    }

    await this.moodTrackerRepository.remove(moodTracker);
  }

  /**
   * Получить текущее настроение (за сегодня)
   */
  async getCurrentMood(): Promise<MoodTrackerResponseDto | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const moodTracker = await this.moodTrackerRepository.findOne({
      where: { moodDate: today },
    });

    return moodTracker ? this.mapToResponseDto(moodTracker) : null;
  }

  /**
   * Преобразовать MoodTracker в ResponseDto
   */
  private mapToResponseDto(moodTracker: MoodTracker): MoodTrackerResponseDto {
    const moodType = this.moodTypesService.getMoodTypeById(moodTracker.moodType);
    
    return {
      id: moodTracker.id,
      moodType: moodTracker.moodType,
      moodTypeDetails: moodType || null,
      notes: moodTracker.notes,
      moodDate: moodTracker.moodDate,
      createdAt: moodTracker.createdAt,
      updatedAt: moodTracker.updatedAt,
    };
  }
}
