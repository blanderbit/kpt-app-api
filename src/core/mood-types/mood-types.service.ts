import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';
export interface MoodType {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
  score: number;
  category: 'positive' | 'neutral' | 'negative';
}

export interface MoodTypesData {
  moodTypes: MoodType[];
  categories: Record<string, string>;
  defaultMood: string;
}

@Injectable()
export class MoodTypesService {
  private readonly logger = new Logger(MoodTypesService.name);
  private moodTypesData: MoodTypesData;
  private readonly fileId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly googleDriveFilesService: GoogleDriveFilesService,
  ) {
    this.fileId = this.configService.get<string>('MOOD_TYPES_FILE_ID') || '';
    this.loadMoodTypes();
  }

  /**
   * Загружает типы настроения из Google Drive
   */
  async loadMoodTypes(): Promise<void> {
    try {
      // Загружаем из Google Drive
      if (this.fileId && this.googleDriveFilesService.isAvailable()) {
        this.logger.log('Loading mood types from Google Drive');
        this.moodTypesData = await this.googleDriveFilesService.getFileContent(this.fileId);
        return;
      }

      // Если Google Drive недоступен, используем базовые типы
      this.logger.warn('Google Drive not available, using fallback mood types');
      this.moodTypesData = {
        moodTypes: [
          {
            id: 'fine',
            name: 'Нормально',
            description: 'Нормальное настроение',
            emoji: '😐',
            color: '#FFEB3B',
            score: 7,
            category: 'neutral'
          }
        ],
        categories: {
          'neutral': 'Нейтральное'
        },
        defaultMood: 'fine'
      };
    } catch (error) {
      this.logger.error('Ошибка загрузки типов настроения:', error);
      // Fallback к базовым типам
      this.moodTypesData = {
        moodTypes: [
          {
            id: 'fine',
            name: 'Нормально',
            description: 'Нормальное настроение',
            emoji: '😐',
            color: '#FFEB3B',
            score: 7,
            category: 'neutral'
        }
        ],
        categories: {
          'neutral': 'Нейтральное'
        },
        defaultMood: 'fine'
      };
    }
  }

  /**
   * Получить все типы настроения
   */
  getAllMoodTypes(): MoodType[] {
    return this.moodTypesData.moodTypes;
  }

  /**
   * Получить тип настроения по ID
   */
  getMoodTypeById(id: string): MoodType | undefined {
    return this.moodTypesData.moodTypes.find(type => type.id === id);
  }

  /**
   * Получить все категории настроения
   */
  getAllCategories(): Record<string, string> {
    return this.moodTypesData.categories;
  }

  /**
   * Получить типы настроения по категории
   */
  getMoodTypesByCategory(category: string): MoodType[] {
    return this.moodTypesData.moodTypes.filter(type => type.category === category);
  }

  /**
   * Получить дефолтный тип настроения
   */
  getDefaultMoodType(): MoodType | undefined {
    return this.getMoodTypeById(this.moodTypesData.defaultMood);
  }

  /**
   * Получить статистику по типам настроения
   */
  getMoodTypesStats(): {
    totalTypes: number;
    totalCategories: number;
    typesByCategory: Record<string, number>;
    averageScore: number;
  } {
    const totalTypes = this.moodTypesData.moodTypes.length;
    const totalCategories = Object.keys(this.moodTypesData.categories).length;
    
    const typesByCategory: Record<string, number> = {};
    let totalScore = 0;
    
    this.moodTypesData.moodTypes.forEach(type => {
      typesByCategory[type.category] = (typesByCategory[type.category] || 0) + 1;
      totalScore += type.score;
    });

    const averageScore = totalScore / totalTypes;

    return {
      totalTypes,
      totalCategories,
      typesByCategory,
      averageScore: Math.round(averageScore * 100) / 100,
    };
  }

  /**
   * Поиск типов настроения по ключевому слову
   */
  searchMoodTypes(query: string): MoodType[] {
    const searchQuery = query.toLowerCase();
    
    return this.moodTypesData.moodTypes.filter(type => 
      type.name.toLowerCase().includes(searchQuery) ||
      type.description.toLowerCase().includes(searchQuery) ||
      type.category.toLowerCase().includes(searchQuery)
    );
  }

  /**
   * Получить рекомендуемые типы настроения по описанию
   */
  getRecommendedMoodTypes(description: string, limit: number = 3): MoodType[] {
    const desc = description.toLowerCase();
    const scoredTypes = this.moodTypesData.moodTypes.map(type => {
      let score = 0;
      
      // Проверяем название типа
      if (desc.includes(type.name.toLowerCase())) {
        score += 2;
      }

      // Проверяем описание типа
      if (desc.includes(type.description.toLowerCase())) {
        score += 1;
      }

      // Проверяем категорию
      if (desc.includes(type.category.toLowerCase())) {
        score += 0.5;
      }

      return { type, score };
    });

    // Сортируем по счету и возвращаем топ результаты
    return scoredTypes
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.type);
  }

  /**
   * Валидировать ID типа настроения
   */
  isValidMoodTypeId(id: string): boolean {
    return this.moodTypesData.moodTypes.some(type => type.id === id);
  }

  /**
   * Получить типы настроения с высоким рейтингом
   */
  getHighRatedMoodTypes(threshold: number = 7): MoodType[] {
    return this.moodTypesData.moodTypes.filter(type => type.score >= threshold);
  }

  /**
   * Получить типы настроения с низким рейтингом
   */
  getLowRatedMoodTypes(threshold: number = 4): MoodType[] {
    return this.moodTypesData.moodTypes.filter(type => type.score <= threshold);
  }

  /**
   * Обновить типы настроения в Google Drive
   */
  async updateMoodTypes(newData: MoodTypesData): Promise<void> {
    if (!this.fileId || !this.googleDriveFilesService.isAvailable()) {
      throw new Error('Google Drive not available for updating mood types');
    }

    try {
      await this.googleDriveFilesService.updateFileContent(this.fileId, newData);
      this.moodTypesData = newData;
      this.logger.log('Mood types updated successfully in Google Drive');
    } catch (error) {
      this.logger.error('Failed to update mood types in Google Drive', error);
      throw error;
    }
  }

  /**
   * Перезагрузить типы настроения
   */
  async reloadMoodTypes(): Promise<void> {
    await this.loadMoodTypes();
  }
}
