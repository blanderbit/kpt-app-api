import { Injectable, Logger } from '@nestjs/common';
import { MoodTypesService } from '../../core/mood-types';

@Injectable()
export class MoodTypesAdminService {
  private readonly logger = new Logger(MoodTypesAdminService.name);

  constructor(
    private readonly moodTypesService: MoodTypesService,
  ) {}

  /**
   * Синхронизация типов настроения с Google Drive
   * Перезагружает данные из Google Drive
   */
  async syncWithDrive(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Starting mood types sync with Google Drive...');
      
      // Перезагружаем типы настроения из Google Drive
      await this.moodTypesService.loadMoodTypes();
      
      this.logger.log('Mood types synced successfully with Google Drive');
      
      return {
        success: true,
        message: 'Типы настроения успешно синхронизированы с Google Drive'
      };
    } catch (error) {
      this.logger.error('Failed to sync mood types with Google Drive', error);
      
      return {
        success: false,
        message: `Ошибка синхронизации: ${error.message}`
      };
    }
  }

  /**
   * Получить все типы настроения
   */
  async getAllMoodTypes() {
    return this.moodTypesService.getAllMoodTypes();
  }

  /**
   * Получить типы настроения по категории
   */
  async getMoodTypesByCategory(category: string) {
    return this.moodTypesService.getMoodTypesByCategory(category);
  }

  /**
   * Получить статистику типов настроения
   */
  async getMoodTypesStats() {
    return this.moodTypesService.getMoodTypesStats();
  }
}
