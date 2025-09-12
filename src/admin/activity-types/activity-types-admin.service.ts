import { Injectable, Logger } from '@nestjs/common';
import { ActivityTypesService } from '../../core/activity-types';

@Injectable()
export class ActivityTypesAdminService {
  private readonly logger = new Logger(ActivityTypesAdminService.name);

  constructor(private readonly activityTypesService: ActivityTypesService) {}

  /**
   * Синхронизация типов активности с Google Drive
   * Перезагружает данные из Google Drive
   */
  async syncWithDrive(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Starting activity types sync with Google Drive...');
      
      // Перезагружаем типы активности из Google Drive
      await this.activityTypesService.loadActivityTypes();
      
      this.logger.log('Activity types synced successfully with Google Drive');
      
      return {
        success: true,
        message: 'Типы активности успешно синхронизированы с Google Drive'
      };
    } catch (error) {
      this.logger.error('Failed to sync activity types with Google Drive', error);
      
      return {
        success: false,
        message: `Ошибка синхронизации: ${error.message}`
      };
    }
  }

  /**
   * Получить все типы активности
   */
  async getAllActivityTypes() {
    return this.activityTypesService.getAllActivityTypes();
  }

  /**
   * Получить типы активности по категории
   */
  async getActivityTypesByCategory(category: string) {
    return this.activityTypesService.getActivityTypesByCategory(category);
  }

  /**
   * Получить категории активности
   */
  async getActivityCategories() {
    return this.activityTypesService.getAllCategories();
  }

  /**
   * Получить статистику типов активности
   */
  async getActivityTypesStats() {
    return this.activityTypesService.getActivityTypesStats();
  }
}
