import { Injectable, Logger, BadRequestException, ConflictException, OnModuleInit } from '@nestjs/common';
import { ErrorCode } from '../../../common/error-codes';
import { AppException } from '../../../common/exceptions/app.exception';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleDriveService } from '../../../core/google-drive';
import { CreateLanguageDto, UpdateLanguageDto, LanguageResponseDto, DownloadTemplateDto } from '../dto/language.dto';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class LanguageService implements OnModuleInit {
  private readonly logger = new Logger(LanguageService.name);
  private languagesCache: LanguageResponseDto[] = [];
  private archivedLanguagesCache: LanguageResponseDto[] = [];
  private lastSyncDate: Date | null = null;
  private lastArchivedSyncDate: Date | null = null;

  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly settingsService: SettingsService,
  ) {}

  /**
   * Initialize languages on application startup
   */
  async onModuleInit() {
    this.logger.log('Initializing language service - loading languages from Google Drive...');
    await this.syncLanguagesFromGoogleDrive();
    await this.syncArchivedLanguagesFromGoogleDrive();
  }

  /**
   * Get languages from cache
   */
  getLanguagesFromCache(): LanguageResponseDto[] {
    return this.languagesCache;
  }

  /**
   * Get archived languages from cache 
   */
  getArchivedLanguagesFromCache(): LanguageResponseDto[] {
    return this.archivedLanguagesCache;
  }

  /**
   * Get translations object for a language by code (from cache).
   * Cache is filled from Google Drive on sync (POST /admin/languages/sync or on app init).
   * Files in Drive (from admin) have structure { translations: { ...keys... }, language?: {...} };
   * we return the inner object with keys so that onboarding_questions.* resolve correctly.
   * Fallback: requested code → 'en' → null.
   */
  getTranslationsByCode(code: string): Record<string, any> | null {
    const normalized = code?.trim().toLowerCase().replace('_', '-') || 'en';
    const langs = this.getLanguagesFromCache();
    this.logger.log(`[getTranslationsByCode] code="${code}" normalized="${normalized}" cacheSize=${langs.length} cacheCodes=[${langs.map(l => l.code || '(empty)').join(', ')}]`);
    let lang = langs.find(l => (l.code || '').toLowerCase().replace('_', '-') === normalized);
    if (!lang) {
      lang = langs.find(l => (l.code || '').toLowerCase() === 'en');
      if (lang) this.logger.log(`[getTranslationsByCode] fallback to en: code=${lang.code}`);
    }
    const raw = lang?.translations;
    if (!raw || typeof raw !== 'object') {
      this.logger.warn(`[getTranslationsByCode] no translations for code="${code}": lang=${lang ? lang.code : 'not found'}, rawType=${raw === undefined ? 'undefined' : typeof raw}`);
      return null;
    }
    const topKeys = Object.keys(raw).slice(0, 8);
    const inner = raw.translations;
    const hasInnerObject = inner && typeof inner === 'object' && !Array.isArray(inner);
    this.logger.log(`[getTranslationsByCode] code="${code}" raw topKeys=[${topKeys.join(', ')}] hasInnerTranslations=${hasInnerObject} innerType=${inner === undefined ? 'undefined' : inner === null ? 'null' : Array.isArray(inner) ? 'array' : typeof inner}`);
    // Drive file from admin: { translations: { home, auth, onboarding_questions, ... } }
    if (hasInnerObject) {
      const innerKeys = Object.keys(inner).slice(0, 8);
      this.logger.log(`[getTranslationsByCode] returning inner translations, keys=[${innerKeys.join(', ')}]`);
      return inner;
    }
    // translations might be stored as string (double-encoded JSON)
    if (inner && typeof inner === 'string') {
      try {
        const parsed = JSON.parse(inner);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          this.logger.log(`[getTranslationsByCode] parsed translations string, keys=[${Object.keys(parsed).slice(0, 8).join(', ')}]`);
          return parsed;
        }
      } catch (_) {
        this.logger.warn(`[getTranslationsByCode] failed to parse translations string for code="${code}"`);
      }
    }
    this.logger.log(`[getTranslationsByCode] returning raw as translations (no inner object)`);
    return raw;
  }

  /**
   * Get last sync date
   */
  getLastSyncDate(): Date | null {
    return this.lastSyncDate;
  }

  /**
   * Get last archived sync date
   */
  getLastArchivedSyncDate(): Date | null {
    return this.lastArchivedSyncDate;
  }

  /**
   * Sync languages from Google Drive to cache
   */
  async syncLanguagesFromGoogleDrive(): Promise<{ languages: LanguageResponseDto[], syncedAt: Date }> {
    try {
      this.logger.log('[syncLanguagesFromGoogleDrive] Syncing languages from Google Drive...');
      const languages = await this.getLanguagesFromGoogleDrive();
      this.languagesCache = languages;
      this.lastSyncDate = new Date();
      this.settingsService.updateLastSync('languages');
      this.logger.log(`[syncLanguagesFromGoogleDrive] Successfully synced ${languages.length} languages from Google Drive`);
      for (const l of languages) {
        const raw = l.translations;
        const hasTranslations = raw && typeof raw === 'object';
        const topKeys = hasTranslations ? Object.keys(raw).slice(0, 6) : [];
        const hasInner = hasTranslations && raw.translations && typeof raw.translations === 'object';
        const innerKeys = hasInner ? Object.keys(raw.translations).slice(0, 6) : [];
        this.logger.log(`[syncLanguagesFromGoogleDrive] cache lang code="${l.code}" id=${l.id} hasTranslations=${hasTranslations} topKeys=[${topKeys.join(', ')}] hasInnerTranslations=${hasInner} innerKeys=[${innerKeys.join(', ')}]`);
      }
      return {
        languages: this.languagesCache,
        syncedAt: this.lastSyncDate,
      };
    } catch (error) {
      this.logger.error('Failed to sync languages from Google Drive', error);
      throw error;
    }
  }

  /**
   * Sync archived languages from Google Drive to cache
   */
  async syncArchivedLanguagesFromGoogleDrive(): Promise<{ languages: LanguageResponseDto[], syncedAt: Date }> {
    try {
      this.logger.log('Syncing archived languages from Google Drive...');
      const languages = await this.getArchivedLanguages();
      this.archivedLanguagesCache = languages;
      this.lastArchivedSyncDate = new Date();
      this.logger.log(`Successfully synced ${languages.length} archived languages from Google Drive`);
      
      return {
        languages: this.archivedLanguagesCache,
        syncedAt: this.lastArchivedSyncDate,
      };
    } catch (error) {
      this.logger.error('Failed to sync archived languages from Google Drive', error);
      throw error;
    }
  }

  /**
   * Получить архивированные языки
   */
  async getArchivedLanguages(): Promise<LanguageResponseDto[]> {
    try {
      const archiveFolderId = await this.googleDriveService.getArchiveFolder();
      const files = await this.googleDriveService.listFiles(archiveFolderId);
      const archivedFiles = files.filter(file => file.mimeType === 'application/json');
      
      // Загружаем каждый файл параллельно
      const languages = await Promise.all(
        archivedFiles.map(async (file) => {
          try {
            const props = file.appProperties || {};
            
            // Читаем содержимое файла для получения translations
            const fileContent = await this.googleDriveService.getFileContent(file.id);
            const translations = JSON.parse(fileContent);
            
            // Подсчитываем ключи
            const totalKeys = this.countTranslationKeys(translations);
            
            return {
              id: file.id as any,
              code: props.code || '',
              name: props.name || '',
              nativeName: props.nativeName || '',
              direction: (props.direction as 'ltr' | 'rtl') || 'ltr',
              isActive: false, // Archived languages are always inactive
              isDefault: false, // Archived languages are never default
              version: props.version || '1.0.0',
              googleDriveFileId: file.id,
              googleDriveFileUrl: file.webViewLink,
              googleDriveFolderId: archiveFolderId,
              totalKeys: totalKeys,
              totalTranslations: totalKeys,
              completionRate: 100,
              notes: props.notes,
              svgLogo: props.svgLogo,
              translations,
              createdBy: props.createdBy,
              updatedBy: props.updatedBy,
              createdAt: new Date(props.createdAt || Date.now()),
              updatedAt: new Date(props.updatedAt || Date.now()),
              isArchived: true,
            };
          } catch (error) {
            this.logger.error(`Failed to load archived file ${file.name}: ${error.message}`);
            return null;
          }
        })
      );

      // Filter out failed loads
      return languages.filter(lang => lang !== null).sort((a, b) => a.code.localeCompare(b.code));
    } catch (error) {
      this.logger.error('Failed to get archived languages from Google Drive', error);
      throw new BadRequestException('Failed to get archived languages from Google Drive');
    }
  }

  /**
   * Permanently delete archived language
   */
  async deleteArchivedLanguage(fileId: string, adminUser: string): Promise<{ message: string }> {
    try {
      // Verify file is in archive folder
      const fileInfo = await this.googleDriveService.getFileInfo(fileId);
      const currentFolderId = (fileInfo as any).parents?.[0];
      const archiveFolderId = await this.googleDriveService.getArchiveFolder();
      
      if (currentFolderId !== archiveFolderId) {
        throw AppException.validation(ErrorCode.ADMIN_LANGUAGE_NOT_IN_ARCHIVE, 'Language is not in archive folder');
      }

      // Delete file from Google Drive
      await this.googleDriveService.deleteFile(fileId);
      
      this.logger.log(`Language ${fileId} permanently deleted by ${adminUser}`);
      
      return {
        message: 'Language permanently deleted from archive'
      };
    } catch (error) {
      this.logger.error(`Failed to delete archived language: ${error.message}`);
      throw error;
    }
  }

  /**
   * Получить все языки из Google Drive (читаем файлы с translations)
   */
  async getLanguagesFromGoogleDrive(): Promise<LanguageResponseDto[]> {
    try {
      const files = await this.getLanguageFiles();
      const filteredFiles = files.filter(file => !file.name.includes('archived'));
      this.logger.log(`[getLanguagesFromGoogleDrive] folder LANGUAGES_FOLDER_ID: found ${files.length} files, after filter ${filteredFiles.length}. names=[${filteredFiles.map(f => f.name).join(', ')}]`);

      // Загружаем каждый файл параллельно
      const languages = await Promise.all(
        filteredFiles.map(async (file) => {
          try {
            const props = file.appProperties || {};
            this.logger.log(`[getLanguagesFromGoogleDrive] loading file id=${file.id} name="${file.name}" appProperties.code="${props.code || ''}"`);

            // Читаем содержимое файла для получения translations
            const fileContent = await this.googleDriveService.getFileContent(file.id);
            const translations = JSON.parse(fileContent);
            const fileTopKeys = Object.keys(translations).slice(0, 8);
            const inner = translations.translations;
            const hasInner = inner && typeof inner === 'object' && !Array.isArray(inner);
            const innerTopKeys = hasInner ? Object.keys(inner).slice(0, 6) : [];
            const innerType = inner === undefined ? 'undefined' : inner === null ? 'null' : Array.isArray(inner) ? 'array' : typeof inner;
            if (!hasInner && fileTopKeys.includes('translations')) {
              this.logger.warn(`[getLanguagesFromGoogleDrive] file "${file.name}" has "translations" but it is not a plain object: type=${innerType}. Keys inside: ${inner && typeof inner === 'object' ? Object.keys(inner).slice(0, 6).join(', ') : '(n/a)'}`);
            }
            this.logger.log(`[getLanguagesFromGoogleDrive] file "${file.name}" parsed ok. topKeys=[${fileTopKeys.join(', ')}] hasInnerTranslations=${hasInner} innerKeys=[${innerTopKeys.join(', ')}]`);

            // Подсчитываем ключи
            const totalKeys = this.countTranslationKeys(translations);

            return {
              id: file.id as any,
              code: props.code || '',
              name: props.name || '',
              nativeName: props.nativeName || '',
              direction: (props.direction as 'ltr' | 'rtl') || 'ltr',
              isActive: props.isActive === 'true',
              isDefault: props.isDefault === 'true',
              version: props.version || '1.0.0',
              googleDriveFileId: file.id,
              googleDriveFileUrl: file.webViewLink,
              googleDriveFolderId: '', // Не нужен для списка
              totalKeys: totalKeys,
              totalTranslations: totalKeys,
              completionRate: 100, // Если есть все ключи, то 100%
              notes: props.notes,
              svgLogo: props.svgLogo,
              translations,
              createdBy: props.createdBy,
              updatedBy: props.updatedBy,
              createdAt: new Date(props.createdAt || Date.now()),
              updatedAt: new Date(props.updatedAt || Date.now()),
              isArchived: false,
            };
          } catch (error) {
            this.logger.error(`[getLanguagesFromGoogleDrive] Failed to load file ${file.name} id=${file.id}: ${error.message}`);
            // Возвращаем базовую информацию если не удалось загрузить
            const props = file.appProperties || {};
            return {
              id: file.id as any,
              code: props.code || '',
              name: props.name || '',
              nativeName: props.nativeName || '',
              direction: (props.direction as 'ltr' | 'rtl') || 'ltr',
              isActive: props.isActive === 'true',
              isDefault: props.isDefault === 'true',
              version: props.version || '1.0.0',
              googleDriveFileId: file.id,
              googleDriveFileUrl: file.webViewLink,
              googleDriveFolderId: '',
              totalKeys: 0,
              totalTranslations: 0,
              translations: {},
              completionRate: 0,
              notes: props.notes,
              svgLogo: props.svgLogo,
              createdBy: props.createdBy,
              updatedBy: props.updatedBy,
              createdAt: new Date(props.createdAt || Date.now()),
              updatedAt: new Date(props.updatedAt || Date.now()),
              isArchived: false,
            };
          }
        })
      );

      return languages.sort((a, b) => a.code.localeCompare(b.code));
    } catch (error) {
      this.logger.error('Failed to get languages from Google Drive', error);
      throw new BadRequestException('Failed to get languages from Google Drive');
    }
  }

  /**
   * Подсчет ключей в объекте translations (рекурсивно)
   */
  private countTranslationKeys(obj: any, count = 0): number {
    if (typeof obj !== 'object' || obj === null) {
      return count;
    }

    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        // Рекурсивно считаем вложенные объекты
        count = this.countTranslationKeys(obj[key], count);
      } else {
        // Считаем только конечные ключи (не объекты)
        count++;
      }
    }

    return count;
  }

  /**
   * Получить активные языки
   */
  async getActiveLanguages(): Promise<LanguageResponseDto[]> {
    try {
      const rootFolderId = await this.googleDriveService.getLanguagesRootFolder();
      const files = await this.googleDriveService.listFiles(rootFolderId);
      
      const activeLanguages: LanguageResponseDto[] = [];
      
      // Фильтруем только JSON файлы и обрабатываем их параллельно
      const jsonFiles = files.filter(file => 
        file.mimeType === 'application/json' && 
        !file.name.includes('archived')
      );

      // Получаем данные для всех файлов параллельно
      const languagePromises = jsonFiles.map(async (file) => {
        try {
          const languageData = await this.getLanguageDataFromGoogleDrive(file.id);
          return languageData.isActive ? languageData : null;
        } catch (error) {
          this.logger.warn(`Failed to get language data for file: ${file.name}`, error);
          return null;
        }
      });

      const results = await Promise.allSettled(languagePromises);
      
      // Собираем успешные результаты
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          activeLanguages.push(result.value);
        }
      }

      return activeLanguages.sort((a, b) => a.code.localeCompare(b.code));
    } catch (error) {
      this.logger.error('Failed to get active languages', error);
      throw new BadRequestException('Failed to get active languages');
    }
  }

  /**
   * Получить язык по ID файла в Google Drive
   */
  async getLanguageById(fileId: string): Promise<LanguageResponseDto> {
    try {
      const fileInfo = await this.googleDriveService.getFileInfo(fileId);
      
      // if (fileInfo.mimeType !== 'application/json') {
        // throw new BadRequestException('File is not a valid language file');
      // }


      return await this.getLanguageDataFromGoogleDrive(fileId);
    } catch (error) {
      this.logger.error(`Failed to get language by ID: ${fileId}`, error);
      throw new BadRequestException('Language not found');
    }
  }

  /**
   * Получить язык по коду
   */
  async getLanguageByCode(code: string): Promise<LanguageResponseDto> {
    try {
      const rootFolderId = await this.googleDriveService.getLanguagesRootFolder();
      const files = await this.googleDriveService.listFiles(rootFolderId);
      
      // Ищем файл по коду языка
      const targetFile = files.find(file => 
        file.mimeType === 'application/json' && 
        !file.name.includes('archived') &&
        file.name === `${code}.json`
      );
      
      if (!targetFile) {
        throw new BadRequestException(`Language with code ${code} not found`);
      }

      return await this.getLanguageDataFromGoogleDrive(targetFile.id);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to get language by code: ${code}`, error);
      throw new BadRequestException(`Language with code ${code} not found`);
    }
  }

  /**
   * Создать новый язык
   */
  async createLanguage(createLanguageDto: CreateLanguageDto, adminUser: string): Promise<LanguageResponseDto> {
    try {
      // Проверяем, не существует ли уже язык с таким кодом
      const rootFolderId = await this.googleDriveService.getLanguagesRootFolder();
      const files = await this.googleDriveService.listFiles(rootFolderId);
      
      const existingFile = files.find(file => 
        file.mimeType === 'application/json' && 
        !file.name.includes('archived') &&
        file.name === `${createLanguageDto.code}.json`
      );

      if (existingFile) {
        throw new ConflictException(`Language with code ${createLanguageDto.code} already exists`);
      }

      // Проверяем, есть ли уже дефолтный язык
      const hasDefault = await this.hasDefaultLanguage(files);
      const isDefault = createLanguageDto.isDefault ?? !hasDefault;

      // Создаем временный файл
      const tempFilePath = path.join(process.cwd(), 'data/languages', `temp-${createLanguageDto.code}-${Date.now()}.json`);
      
      try {
        // Создаем структуру языка только с переводами
        const languageTemplate = {
          translations: createLanguageDto.translations || {},
          language: {
            code: createLanguageDto.code,
            name: createLanguageDto.name,
            svgLogo: createLanguageDto.svgLogo,
            nativeName: createLanguageDto.nativeName,
            direction: createLanguageDto.direction || 'ltr',
            isActive: String(createLanguageDto.isActive ?? true),
            isDefault: String(isDefault),
            version: createLanguageDto.version || '1.0.0',
          }
        };
        
        // Записываем созданный шаблон во временный файл
        fs.writeFileSync(tempFilePath, JSON.stringify(languageTemplate, null, 2));

        const translations = createLanguageDto.translations || {};
        const totalKeys = this.countTotalKeys(translations);
        const totalTranslations = this.countTotalTranslations(translations);
        const completionRate = this.calculateCompletionRate(translations);

        // Загружаем файл в Google Drive с appProperties (все метаданные здесь)
        const uploadResult = await this.googleDriveService.uploadFile(
          tempFilePath,
          `${createLanguageDto.code}.json`,
          rootFolderId,
          {
            code: createLanguageDto.code,
            name: createLanguageDto.name,
            nativeName: createLanguageDto.nativeName,
            direction: createLanguageDto.direction || 'ltr',
            isActive: String(createLanguageDto.isActive ?? true),
            isDefault: String(isDefault),
            version: createLanguageDto.version || '1.0.0',
            totalKeys: String(totalKeys),
            totalTranslations: String(totalTranslations),
            completionRate: String(completionRate),
          }
        );

        this.logger.log(`Created language: ${createLanguageDto.code} with file ID: ${uploadResult.fileId}`);

        // Возвращаем созданный язык
        return {
          id: uploadResult.fileId as any,
          code: createLanguageDto.code,
          name: createLanguageDto.name,
          nativeName: createLanguageDto.nativeName,
          direction: createLanguageDto.direction || 'ltr',
          isActive: createLanguageDto.isActive ?? true,
          isDefault: isDefault,
          version: createLanguageDto.version || '1.0.0',
          googleDriveFileId: uploadResult.fileId,
          googleDriveFileUrl: uploadResult.fileUrl,
          googleDriveFolderId: rootFolderId,
          totalKeys,
          totalTranslations,
          completionRate,
          notes: createLanguageDto.notes,
          svgLogo: createLanguageDto.svgLogo,
          createdBy: adminUser,
          updatedBy: adminUser,
          createdAt: new Date(),
          updatedAt: new Date(),
          isArchived: false,
        };
      } finally {
        // Удаляем временный файл в любом случае
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to create language: ${createLanguageDto.code}`, error);
      throw error;
    }
  }

  /**
   * Обновить язык
   */
  async updateLanguage(fileId: string, updateLanguageDto: UpdateLanguageDto, adminUser: string): Promise<LanguageResponseDto> {
    try {
      // Получаем текущий язык и файл
      const fileInfo = await this.googleDriveService.getFileInfo(fileId);
      const currentProps = fileInfo.appProperties || {};

      // Обновляем переводы, если они предоставлены
      if (updateLanguageDto.translations !== undefined) {
        const fileContent = await this.googleDriveService.getFileContent(fileId);
        const languageData = JSON.parse(fileContent);
        
        languageData.translations = updateLanguageDto.translations;
        
        // Пересчитываем статистику переводов
        const totalKeys = this.countTotalKeys(updateLanguageDto.translations);
        const totalTranslations = this.countTotalTranslations(updateLanguageDto.translations);
        const completionRate = this.calculateCompletionRate(updateLanguageDto.translations);

        // Создаем временный файл для обновления
        const tempFilePath = path.join(process.cwd(), 'data/languages', `temp-${currentProps.code}-${Date.now()}.json`);
        
        try {
          fs.writeFileSync(tempFilePath, JSON.stringify(languageData, null, 2));
          await this.googleDriveService.updateFile(fileId, tempFilePath);
          
          // Обновляем статистику в appProperties
          currentProps.totalKeys = String(totalKeys);
          currentProps.totalTranslations = String(totalTranslations);
          currentProps.completionRate = String(completionRate);
        } finally {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        }
      }

      // Обновляем метаданные в appProperties
      const updatedProperties = { ...currentProps };
      
      if (updateLanguageDto.name !== undefined) updatedProperties.name = updateLanguageDto.name;
      if (updateLanguageDto.nativeName !== undefined) updatedProperties.nativeName = updateLanguageDto.nativeName;
      if (updateLanguageDto.direction !== undefined) updatedProperties.direction = updateLanguageDto.direction;
      if (updateLanguageDto.version !== undefined) updatedProperties.version = updateLanguageDto.version;
      if (updateLanguageDto.notes !== undefined) updatedProperties.notes = updateLanguageDto.notes;
      if (updateLanguageDto.svgLogo !== undefined) updatedProperties.svgLogo = updateLanguageDto.svgLogo;
      if (updateLanguageDto.isActive !== undefined) updatedProperties.isActive = String(updateLanguageDto.isActive);
      if (updateLanguageDto.isDefault !== undefined) updatedProperties.isDefault = String(updateLanguageDto.isDefault);
      
      updatedProperties.updatedBy = adminUser;
      updatedProperties.updatedAt = new Date().toISOString();

      // Обновляем appProperties
      await this.googleDriveService.updateFileProperties(fileId, updatedProperties);

      this.logger.log(`Updated language: ${updatedProperties.code || fileId}`);

      // Возвращаем обновленный язык
      return await this.getLanguageById(fileId);
    } catch (error) {
      this.logger.error(`Failed to update language: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Архивировать язык (переместить в архивную папку)
   */
  async archiveLanguage(fileId: string, adminUser: string, reason?: string): Promise<{ message: string }> {

    try {
      const language = await this.getLanguageById(fileId);
      const isDefaultLanguage = language.isDefault;

      // Проверяем, не находится ли файл уже в архиве
      const fileInfo = await this.googleDriveService.getFileInfo(fileId);
      const currentFolderId = (fileInfo as any).parents?.[0];
      const rootFolderId = await this.googleDriveService.getLanguagesRootFolder();
      
      if (currentFolderId === await this.googleDriveService.getArchiveFolder()) {
        throw AppException.validation(ErrorCode.ADMIN_LANGUAGE_ALREADY_ARCHIVED, 'Language is already archived');
      }

      // Если архивируем дефолтный язык, находим первый доступный язык и делаем его дефолтным
      if (isDefaultLanguage) {
        this.logger.log('Archiving default language, setting another language as default...');
        
        const files = await this.googleDriveService.listFiles(rootFolderId);
        const jsonFiles = files.filter(file => 
          file.mimeType === 'application/json' && 
          !file.name.includes('archived') &&
          file.id !== fileId
        );

        if (jsonFiles.length > 0) {
          const firstAvailableFile = jsonFiles[0];
          this.logger.log(`Setting ${firstAvailableFile.name} as new default language`);
          
          // Устанавливаем первый доступный файл как дефолтный
          await this.setDefaultLanguage(firstAvailableFile.id, adminUser);
        }
      }

      // Перемещаем файл в архивную папку в Google Drive, передаем уже полученный fileInfo
      const archiveFolderId = await this.googleDriveService.getArchiveFolder();
      await this.googleDriveService.moveToArchive(fileId, archiveFolderId, fileInfo);

      // Обновляем метаданные файла (добавляем информацию об архивировании)
      await this.updateLanguageArchiveMetadata(fileId, adminUser, reason);

      this.logger.log(`Archived language: ${language.code} by ${adminUser}${reason ? `, reason: ${reason}` : ''}`);

      return { message: `Language ${language.code} has been archived successfully` };
    } catch (error) {
      this.logger.error(`Failed to archive language: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Восстановить язык из архива
   */
  async restoreLanguage(fileId: string, adminUser: string): Promise<LanguageResponseDto> {
    try {
      // Проверяем, находится ли файл действительно в архиве
      const fileInfo = await this.googleDriveService.getFileInfo(fileId);
      const currentFolderId = (fileInfo as any).parents?.[0];
      const rootFolderId = await this.googleDriveService.getLanguagesRootFolder();
      const archiveFolderId = await this.googleDriveService.getArchiveFolder();
      
      if (currentFolderId !== archiveFolderId) {
        throw AppException.validation(ErrorCode.ADMIN_LANGUAGE_NOT_IN_ARCHIVE, 'Language is not in archive');
      }

      // Перемещаем файл обратно в основную папку
      await this.googleDriveService.moveToArchive(fileId, rootFolderId);

      // Обновляем метаданные файла (убираем информацию об архивировании)
      await this.updateLanguageRestoreMetadata(fileId, adminUser);

      this.logger.log(`Restored language from archive: ${fileId} by ${adminUser}`);

      return await this.getLanguageById(fileId);
    } catch (error) {
      this.logger.error(`Failed to restore language: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Скачать дефолтный шаблон для языка
   */
  async downloadDefaultTemplate(downloadTemplateDto: DownloadTemplateDto): Promise<{ message: string; filePath: string }> {
    const translationsTemplatePath = path.join(process.cwd(), 'data/languages/templates/translations-template.json');
    const outputPath = path.join(process.cwd(), 'data/languages', `${downloadTemplateDto.code}.json`);

    if (!fs.existsSync(translationsTemplatePath)) {
      throw new BadRequestException('Translations template not found');
    }

    // Читаем шаблон переводов
    const translations = JSON.parse(fs.readFileSync(translationsTemplatePath, 'utf8'));
    
    // Создаем структуру языка только с переводами (метаданные будут в appProperties)
    const languageTemplate = {
      translations: translations
    };

    // Сохраняем файл
    fs.writeFileSync(outputPath, JSON.stringify(languageTemplate, null, 2));

    this.logger.log(`Downloaded template for language: ${downloadTemplateDto.code}`);

    return {
      message: `Template for language ${downloadTemplateDto.code} has been downloaded successfully`,
      filePath: outputPath,
    };
  }



  /**
   * Получить файлы языков из Google Drive (приватный метод для внутреннего использования)
   */
  private async getLanguageFiles(): Promise<Array<{ id: string; name: string; mimeType: string; webViewLink: string; appProperties?: any }>> {
    const rootFolderId = await this.googleDriveService.getLanguagesRootFolder();
    const files = await this.googleDriveService.listFiles(rootFolderId);

    // Фильтруем только JSON файлы
    return files.filter(file => file.mimeType === 'application/json');
  }

  /**
   * Get language data including translations (public method)
   */
  async getLanguageData(fileId: string): Promise<{ translations: Record<string, any> }> {
    const languageData = await this.getLanguageDataFromGoogleDrive(fileId);
    
    // Return only translations for editor
    return {
      translations: languageData
    };
  }

  /**
   * Получить данные языка из Google Drive (читаем из appProperties)
   */
  private async getLanguageDataFromGoogleDrive(fileId: string): Promise<LanguageResponseDto> {
    try {
      const fileInfo = await this.googleDriveService.getFileInfo(fileId);
      const props = fileInfo.appProperties || {};

      return {
        id: fileId as any,
        code: props.code || '',
        name: props.name || '',
        nativeName: props.nativeName || '',
        direction: (props.direction as 'ltr' | 'rtl') || 'ltr',
        isActive: props.isActive === 'true',
        isDefault: props.isDefault === 'true',
        version: props.version || '1.0.0',
        googleDriveFileId: fileId,
        googleDriveFileUrl: fileInfo.webViewLink,
        googleDriveFolderId: fileInfo.parents?.[0] || '',
        totalKeys: parseInt(props.totalKeys || '0', 10),
        totalTranslations: parseInt(props.totalTranslations || '0', 10),
        completionRate: parseInt(props.completionRate || '0', 10),
        notes: props.notes,
        svgLogo: props.svgLogo,
        createdBy: props.createdBy,
        updatedBy: props.updatedBy,
        createdAt: new Date(props.createdAt || Date.now()),
        updatedAt: new Date(props.updatedAt || Date.now()),
        isArchived: false, // Определяется по расположению файла
      };
    } catch (error) {
      this.logger.error(`Failed to get language data from Google Drive: ${fileId}`, error);
      throw new BadRequestException('Failed to read language file');
    }
  }

  /**
   * Подсчитать общее количество ключей
   */
  private countTotalKeys(translations: any): number {
    let count = 0;
    const countKeys = (obj: any) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          countKeys(obj[key]);
        } else {
          count++;
        }
      }
    };
    countKeys(translations);
    return count;
  }

  /**
   * Подсчитать количество заполненных переводов
   */
  private countTotalTranslations(translations: any): number {
    let count = 0;
    const countTranslations = (obj: any) => {
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          countTranslations(obj[key]);
        } else if (obj[key] && obj[key].trim() !== '') {
          count++;
        }
      }
    };
    countTranslations(translations);
    return count;
  }

  /**
   * Рассчитать процент завершения
   */
  private calculateCompletionRate(translations: any): number {
    const totalKeys = this.countTotalKeys(translations);
    const totalTranslations = this.countTotalTranslations(translations);
    
    if (totalKeys === 0) return 0;
    return Math.round((totalTranslations / totalKeys) * 100);
  }

  /**
   * Обновить метаданные архивирования языка
   */
  private async updateLanguageArchiveMetadata(fileId: string, adminUser: string, reason?: string): Promise<void> {
    try {
      const fileInfo = await this.googleDriveService.getFileInfo(fileId);
      const updatedProperties = {
        ...fileInfo.appProperties,
        isArchived: 'true',
        archivedAt: new Date().toISOString(),
        archivedBy: adminUser,
        archiveReason: reason || '',
      };

      await this.googleDriveService.updateFileProperties(fileId, updatedProperties);
    } catch (error) {
      this.logger.warn(`Failed to update archive metadata for language: ${fileId}`, error);
      this.logger.error(`Archive metadata update failed for language: ${fileId}`, {
        error: error.message,
        errorCode: ErrorCode.ADMIN_LANGUAGE_ARCHIVE_METADATA_UPDATE_FAILED
      });
    }
  }

  /**
   * Установить язык как дефолтный
   */
  async setDefaultLanguage(fileId: string, adminUser: string): Promise<LanguageResponseDto> {
    try {
      // Получаем список всех языков
      const rootFolderId = await this.googleDriveService.getLanguagesRootFolder();
      const files = await this.googleDriveService.listFiles(rootFolderId);
      
      const jsonFiles = files.filter(file => 
        file.mimeType === 'application/json' && 
        !file.name.includes('archived')
      );

      // Убираем isDefault у всех языков через appProperties
      const updatePromises: Promise<void>[] = [];
      
      for (const file of jsonFiles) {
        if ((file.appProperties?.isDefault === 'true' || file.appProperties?.isDefault === true) && file.id !== fileId) {
          // Обновляем только appProperties, без чтения и записи файла
          const updatedProperties = {
            ...file.appProperties,
            isDefault: 'false'
          };
          updatePromises.push(
            this.googleDriveService.updateFileProperties(file.id, updatedProperties)
          );
        }
      }

      // Выполняем все обновления параллельно
      await Promise.all(updatePromises);

      // Устанавливаем isDefault для текущего языка
      const currentFile = jsonFiles.find(f => f.id === fileId);
      if (!currentFile) {
        throw new BadRequestException('Language file not found');
      }

      const updatedProperties = {
        ...currentFile.appProperties,
        isDefault: 'true'
      };
      
      await this.googleDriveService.updateFileProperties(fileId, updatedProperties);
      
      this.logger.log(`Set language ${currentFile.appProperties?.code || fileId} as default`);
      
      const updatedAt = new Date();

      // Обновляем локальный кеш, чтобы UI сразу видел изменения
      this.languagesCache = this.languagesCache.map((language) => {
        const isTarget = language.id === fileId || language.googleDriveFileId === fileId;
        if (language.isArchived) {
          return language;
        }
        return {
          ...language,
          isDefault: isTarget,
          updatedBy: isTarget ? adminUser : language.updatedBy,
          updatedAt: isTarget ? updatedAt : language.updatedAt,
        };
      });
      this.lastSyncDate = updatedAt;
      this.settingsService.updateLastSync('languages');

      // Получаем полные данные для ответа
      const languageData = await this.getLanguageById(fileId);
      
      return {
        ...languageData,
        isDefault: true,
        updatedBy: adminUser,
        updatedAt,
      };
    } catch (error) {
      this.logger.error(`Failed to set default language: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Установить язык как активный/неактивный
   */
  async setActiveLanguage(fileId: string, isActive: boolean, adminUser: string): Promise<LanguageResponseDto> {
    try {
      // Получаем информацию о файле
      const rootFolderId = await this.googleDriveService.getLanguagesRootFolder();
      const files = await this.googleDriveService.listFiles(rootFolderId);
      
      const currentFile = files.find(f => f.id === fileId);
      if (!currentFile) {
        throw new BadRequestException('Language file not found');
      }

      // Обновляем appProperties
      const updatedProperties = {
        ...currentFile.appProperties,
        isActive: String(isActive)
      };
      
      await this.googleDriveService.updateFileProperties(fileId, updatedProperties);
      
      this.logger.log(`Set language ${currentFile.appProperties?.code || fileId} as ${isActive ? 'active' : 'inactive'}`);
      
      // Получаем полные данные для ответа
      const languageData = await this.getLanguageById(fileId);
      
      return {
        ...languageData,
        isActive: isActive,
        updatedBy: adminUser,
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to set active language: ${fileId}`, error);
      throw error;
    }
  }

  /**
   * Установить все языки как активные
   */
  async setAllLanguagesActive(adminUser: string): Promise<{ message: string; updatedCount: number }> {
    try {
      const rootFolderId = await this.googleDriveService.getLanguagesRootFolder();
      const files = await this.googleDriveService.listFiles(rootFolderId);
      
      const jsonFiles = files.filter(file => 
        file.mimeType === 'application/json' && 
        !file.name.includes('archived')
      );

      // Обновляем isActive для всех языков
      const updatePromises: Promise<void>[] = [];
      
      for (const file of jsonFiles) {
        if (file.appProperties?.isActive !== 'true') {
          const updatedProperties = {
            ...file.appProperties,
            isActive: 'true'
          };
          updatePromises.push(
            this.googleDriveService.updateFileProperties(file.id, updatedProperties)
          );
        }
      }

      // Выполняем все обновления параллельно
      await Promise.all(updatePromises);
      
      this.logger.log(`Set all ${updatePromises.length} languages as active by ${adminUser}`);
      
      return {
        message: `Successfully set ${updatePromises.length} language(s) as active`,
        updatedCount: updatePromises.length,
      };
    } catch (error) {
      this.logger.error('Failed to set all languages as active', error);
      throw error;
    }
  }

  /**
   * Проверить, есть ли дефолтный язык
   */
  private async hasDefaultLanguage(files: Array<{ id: string; name: string; mimeType: string; webViewLink: string; appProperties?: any }>): Promise<boolean> {
    try {
      const jsonFiles = files.filter(file => 
        file.mimeType === 'application/json' && 
        !file.name.includes('archived')
      );

      for (const file of jsonFiles) {
        // Проверяем appProperties вместо чтения файла
        if (file.appProperties?.isDefault === 'true' || file.appProperties?.isDefault === true) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error('Failed to check for default language', error);
      return false;
    }
  }

  /**
   * Обновить метаданные восстановления языка
   */
  private async updateLanguageRestoreMetadata(fileId: string, adminUser: string): Promise<void> {
    try {
      const fileInfo = await this.googleDriveService.getFileInfo(fileId);
      const updatedProperties = { ...fileInfo.appProperties };
      
      // Убираем информацию об архивировании
      delete updatedProperties.isArchived;
      delete updatedProperties.archivedAt;
      delete updatedProperties.archivedBy;
      delete updatedProperties.archiveReason;
      
      // Добавляем информацию о восстановлении
      updatedProperties.restoredAt = new Date().toISOString();
      updatedProperties.restoredBy = adminUser;

      await this.googleDriveService.updateFileProperties(fileId, updatedProperties);
    } catch (error) {
      this.logger.warn(`Failed to update restore metadata for language: ${fileId}`, error);
      this.logger.error(`Restore metadata update failed for language: ${fileId}`, {
        error: error.message,
        errorCode: ErrorCode.ADMIN_LANGUAGE_RESTORE_METADATA_UPDATE_FAILED
      });
    }
  }
}
