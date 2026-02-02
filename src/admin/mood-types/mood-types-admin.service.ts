import { Injectable, Logger } from '@nestjs/common';
import { MoodTypesService } from '../../core/mood-types';
import type { MoodType } from '../../core/mood-types/mood-types.service';
import { LanguageService } from '../languages/services/language.service';

/** Get nested value by dot path, e.g. "mood_types.excellent.name" */
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
export class MoodTypesAdminService {
  private readonly logger = new Logger(MoodTypesAdminService.name);

  constructor(
    private readonly moodTypesService: MoodTypesService,
    private readonly languageService: LanguageService,
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
   * Получить все типы настроения с подстановкой переводов по ключам для языка lang
   */
  async getAllMoodTypes(language?: string): Promise<MoodType[]> {
    const types = this.moodTypesService.getAllMoodTypes();
    return this.resolveMoodTypesWithTranslations(types, language);
  }

  /**
   * Получить типы настроения по категории с подстановкой переводов
   */
  async getMoodTypesByCategory(category: string, language?: string): Promise<MoodType[]> {
    const types = this.moodTypesService.getMoodTypesByCategory(category);
    return this.resolveMoodTypesWithTranslations(types, language);
  }

  /**
   * Получить статистику типов настроения
   */
  async getMoodTypesStats() {
    return this.moodTypesService.getMoodTypesStats();
  }

  /**
   * Разрешить ключи переводов в полях name, description у типов настроения
   */
  private resolveMoodTypesWithTranslations(
    types: MoodType[],
    language?: string,
  ): MoodType[] {
    const lang = language || 'en';
    const translations = this.languageService.getTranslationsByCode(lang);
    if (!translations || typeof translations !== 'object') {
      return types;
    }
    return types.map((type) => ({
      ...type,
      name: resolveText(type.name, translations),
      description: resolveText(type.description, translations),
    }));
  }
}
