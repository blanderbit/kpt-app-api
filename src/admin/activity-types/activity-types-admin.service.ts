import { Injectable, Logger } from '@nestjs/common';
import { ActivityTypesService } from '../../core/activity-types';
import type { ActivityType } from '../../core/activity-types/activity-types.service';
import { LanguageService } from '../languages/services/language.service';

/** Get nested value by dot path, e.g. "activity_types.fitness.name" */
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
function resolveText(
  value: string,
  translations: Record<string, any> | null,
): string {
  if (!value || typeof value !== 'string') return value || '';
  if (!translations) return value;
  const key = value.trim();
  if (!key.includes('.')) return value;
  const resolved = getValueByPath(translations, key);
  return resolved !== undefined ? resolved : value;
}

@Injectable()
export class ActivityTypesAdminService {
  private readonly logger = new Logger(ActivityTypesAdminService.name);

  constructor(
    private readonly activityTypesService: ActivityTypesService,
    private readonly languageService: LanguageService,
  ) {}

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
   * Получить все типы активности с подстановкой переводов по ключам для языка lang
   */
  async getAllActivityTypes(language?: string): Promise<ActivityType[]> {
    const types = this.activityTypesService.getAllActivityTypes();
    return this.resolveActivityTypesWithTranslations(types, language);
  }

  /**
   * Получить типы активности по категории с подстановкой переводов
   */
  async getActivityTypesByCategory(category: string, language?: string): Promise<ActivityType[]> {
    const types = this.activityTypesService.getActivityTypesByCategory(category);
    return this.resolveActivityTypesWithTranslations(types, language);
  }

  /**
   * Получить категории активности с подстановкой переводов (значения — ключи activity_types.categories.*)
   */
  async getActivityCategories(language?: string): Promise<Record<string, string>> {
    const categories = this.activityTypesService.getAllCategories();
    return this.resolveCategoriesWithTranslations(categories, language);
  }

  /**
   * Получить статистику типов активности
   */
  async getActivityTypesStats() {
    return this.activityTypesService.getActivityTypesStats();
  }

  /**
   * Разрешить ключи переводов в полях name, description, keywords у типов активности
   */
  private resolveActivityTypesWithTranslations(
    types: ActivityType[],
    language?: string,
  ): ActivityType[] {
    const lang = language || 'en';
    const translations = this.languageService.getTranslationsByCode(lang);
    if (!translations || typeof translations !== 'object') {
      return types;
    }
    return types.map((type) => ({
      ...type,
      name: resolveText(type.name, translations),
      description: resolveText(type.description, translations),
      keywords: type.keywords.map((kw) => resolveText(kw, translations)),
    }));
  }

  /**
   * Разрешить ключи переводов в значениях категорий (activity_types.categories.*)
   */
  private resolveCategoriesWithTranslations(
    categories: Record<string, string>,
    language?: string,
  ): Record<string, string> {
    const lang = language || 'en';
    const translations = this.languageService.getTranslationsByCode(lang);
    if (!translations || typeof translations !== 'object') {
      return categories;
    }
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(categories)) {
      result[key] = resolveText(value, translations);
    }
    return result;
  }
}
