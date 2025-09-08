import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { ErrorCode } from '../../../common/error-codes';
import { AppException } from '../../../common/exceptions/app.exception';
import * as fs from 'fs';
import * as path from 'path';
import { GoogleDriveService } from './google-drive.service';
import { CreateLanguageDto, UpdateLanguageDto, LanguageResponseDto, DownloadTemplateDto } from '../dto/language.dto';

@Injectable()
export class LanguageService {
  private readonly logger = new Logger(LanguageService.name);

  constructor(
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  /**
   * Получить все языки из Google Drive
   */
  async getAllLanguages(): Promise<Array<Record<string, any>>> {
    try {
      const files = await this.googleDriveService.listFiles(
        await this.googleDriveService.getOrCreateLanguagesRootFolder()
      );

      const languages: Array<Record<string, any>> = [];
      
      for (const file of files) {
        if (file.mimeType === 'application/json' && !file.name.includes('archived')) {
          try {
            // Получаем только базовую информацию о языке без полной загрузки
            const basicInfo = await this.getBasicLanguageInfo(file.id);
            if (basicInfo) {
              languages.push(basicInfo);
            }
          } catch (error) {
            this.logger.warn(`Failed to get basic info for language file: ${file.name}`, error);
          }
        }
      }

      return languages.sort((a, b) => a.code.localeCompare(b.code));
    } catch (error) {
      this.logger.error('Failed to get languages from Google Drive', error);
      throw new BadRequestException('Failed to get languages from Google Drive');
    }
  }

  /**
   * Получить активные языки
   */
  async getActiveLanguages(): Promise<LanguageResponseDto[]> {
    try {
      const rootFolderId = await this.googleDriveService.getOrCreateLanguagesRootFolder();
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
      
      if (fileInfo.mimeType !== 'application/json') {
        throw new BadRequestException('File is not a valid language file');
      }

      return await this.getLanguageDataFromGoogleDrive(fileId);
    } catch (error) {
      this.logger.error(`Failed to get language by ID: ${fileId}`, error);
      throw new BadRequestException('Language not found');
    }
  }

  /**
   * Получить полную информацию о языке по ID (для внутреннего использования)
   */
  async getFullLanguageById(fileId: string): Promise<LanguageResponseDto> {
    return this.getLanguageDataFromGoogleDrive(fileId);
  }

  /**
   * Получить язык по коду
   */
  async getLanguageByCode(code: string): Promise<LanguageResponseDto> {
    try {
      const rootFolderId = await this.googleDriveService.getOrCreateLanguagesRootFolder();
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
      const rootFolderId = await this.googleDriveService.getOrCreateLanguagesRootFolder();
      const files = await this.googleDriveService.listFiles(rootFolderId);
      
      const existingFile = files.find(file => 
        file.mimeType === 'application/json' && 
        !file.name.includes('archived') &&
        file.name === `${createLanguageDto.code}.json`
      );

      if (existingFile) {
        throw new ConflictException(`Language with code ${createLanguageDto.code} already exists`);
      }

      // Создаем временный файл
      const tempFilePath = path.join(process.cwd(), 'data/languages', `temp-${createLanguageDto.code}-${Date.now()}.json`);
      
      try {
        // Записываем шаблон во временный файл
        fs.writeFileSync(tempFilePath, JSON.stringify(createLanguageDto.template, null, 2));

        // Загружаем файл в Google Drive
        const uploadResult = await this.googleDriveService.uploadFile(
          tempFilePath,
          `${createLanguageDto.code}.json`,
          rootFolderId
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
          isDefault: createLanguageDto.isDefault ?? false,
          version: createLanguageDto.version || '1.0.0',
          googleDriveFileId: uploadResult.fileId,
          googleDriveFileUrl: uploadResult.fileUrl,
          googleDriveFolderId: rootFolderId,
          totalKeys: this.countTotalKeys(createLanguageDto.template.translations || {}),
          totalTranslations: this.countTotalTranslations(createLanguageDto.template.translations || {}),
          completionRate: this.calculateCompletionRate(createLanguageDto.template.translations || {}),
          notes: createLanguageDto.notes,
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
      // Получаем текущий язык
      const currentLanguage = await this.getLanguageById(fileId);
      
      // Скачиваем файл из Google Drive
      const localFilePath = path.join(process.cwd(), 'data/languages', `${currentLanguage.code}-temp.json`);
      await this.googleDriveService.downloadFile(fileId, localFilePath);

      // Читаем и обновляем файл
      if (fs.existsSync(localFilePath)) {
        const languageData = JSON.parse(fs.readFileSync(localFilePath, 'utf8'));
        
        // Обновляем метаданные
        if (updateLanguageDto.name) languageData.language.name = updateLanguageDto.name;
        if (updateLanguageDto.nativeName) languageData.language.nativeName = updateLanguageDto.nativeName;
        if (updateLanguageDto.direction) languageData.language.direction = updateLanguageDto.direction;
        if (updateLanguageDto.version) languageData.language.version = updateLanguageDto.version;
        if (updateLanguageDto.notes) languageData.metadata.notes = updateLanguageDto.notes;
        
        languageData.language.lastUpdated = new Date().toISOString();
        languageData.metadata.updatedBy = adminUser;
        languageData.metadata.updatedAt = new Date().toISOString();

        // Сохраняем обновленный файл
        fs.writeFileSync(localFilePath, JSON.stringify(languageData, null, 2));

        // Обновляем файл в Google Drive
        await this.googleDriveService.updateFile(fileId, localFilePath);

        // Удаляем временный файл
        fs.unlinkSync(localFilePath);

        // Возвращаем обновленный язык
        return {
          ...currentLanguage,
          ...updateLanguageDto,
          updatedBy: adminUser,
          updatedAt: new Date(),
          lastSyncAt: new Date(),
        };
      }

      throw new BadRequestException('Failed to update language file');
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

      if (language.isDefault) {
        throw AppException.validation(ErrorCode.ADMIN_LANGUAGE_CANNOT_ARCHIVE_DEFAULT, 'Cannot archive default language');
      }

      // Проверяем, не находится ли файл уже в архиве
      const fileInfo = await this.googleDriveService.getFileInfo(fileId);
      const currentFolderId = (fileInfo as any).parents?.[0];
      const rootFolderId = await this.googleDriveService.getOrCreateLanguagesRootFolder();
      
      if (currentFolderId === await this.googleDriveService.getOrCreateArchiveFolder(rootFolderId)) {
        throw AppException.validation(ErrorCode.ADMIN_LANGUAGE_ALREADY_ARCHIVED, 'Language is already archived');
      }

      // Перемещаем файл в архивную папку в Google Drive
      const archiveFolderId = await this.googleDriveService.getOrCreateArchiveFolder(rootFolderId);
      await this.googleDriveService.moveToArchive(fileId, archiveFolderId);

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
      const rootFolderId = await this.googleDriveService.getOrCreateLanguagesRootFolder();
      const archiveFolderId = await this.googleDriveService.getOrCreateArchiveFolder(rootFolderId);
      
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
    const templatePath = path.join(process.cwd(), 'data/languages/templates/default-language-template.json');
    const outputPath = path.join(process.cwd(), 'data/languages', `${downloadTemplateDto.code}.json`);

    if (!fs.existsSync(templatePath)) {
      throw new BadRequestException('Default language template not found');
    }

    // Читаем шаблон и обновляем его для нового языка
    const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    template.language.code = downloadTemplateDto.code;
    template.language.name = downloadTemplateDto.name;
    template.language.nativeName = downloadTemplateDto.nativeName;
    template.language.lastUpdated = new Date().toISOString();

    // Сохраняем файл
    fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));

    this.logger.log(`Downloaded template for language: ${downloadTemplateDto.code}`);

    return {
      message: `Template for language ${downloadTemplateDto.code} has been downloaded successfully`,
      filePath: outputPath,
    };
  }



  /**
   * Получить языки из Google Drive папки
   */
  async getLanguagesFromGoogleDrive(): Promise<Array<{ id: string; name: string; mimeType: string; webViewLink: string }>> {
    const rootFolderId = await this.googleDriveService.getOrCreateLanguagesRootFolder();
    const files = await this.googleDriveService.listFiles(rootFolderId);

    // Фильтруем только JSON файлы
    return files.filter(file => file.mimeType === 'application/json');
  }

  /**
   * Получить данные языка из Google Drive
   */
  private async getLanguageDataFromGoogleDrive(fileId: string): Promise<LanguageResponseDto> {
    try {
      const fileInfo = await this.googleDriveService.getFileInfo(fileId);
      
      // Получаем содержимое файла напрямую без сохранения локально
      const fileContent = await this.googleDriveService.getFileContent(fileId);
      
      if (!fileContent) {
        throw new BadRequestException('Failed to read language file content');
      }

      const languageData = JSON.parse(fileContent);

      return {
        id: fileId as any, // ID теперь строка из Google Drive
        code: languageData.language.code,
        name: languageData.language.name,
        nativeName: languageData.language.nativeName,
        direction: languageData.language.direction,
        isActive: languageData.language.isActive ?? true,
        isDefault: languageData.language.isDefault ?? false,
        version: languageData.language.version,
        googleDriveFileId: fileId,
        googleDriveFileUrl: fileInfo.webViewLink,
        googleDriveFolderId: (fileInfo as any).parents?.[0] || '',
        totalKeys: this.countTotalKeys(languageData.translations),
        totalTranslations: this.countTotalTranslations(languageData.translations),
        completionRate: this.calculateCompletionRate(languageData.translations),
        notes: languageData.metadata?.notes,
        createdBy: languageData.metadata?.createdBy,
        updatedBy: languageData.metadata?.updatedBy,
        createdAt: new Date(languageData.metadata?.createdAt || Date.now()),
        updatedAt: new Date(languageData.metadata?.updatedAt || Date.now()),
        isArchived: false, // Определяется по расположению файла
      };
    } catch (error) {
      this.logger.error(`Failed to get language data from Google Drive: ${fileId}`, error);
      throw new BadRequestException('Failed to read language file');
    }
  }

  /**
   * Получить базовую информацию о языке из Google Drive
   */
  private async getBasicLanguageInfo(fileId: string): Promise<{ id: string; name: string; code: string } | null> {
    try {
      const fileInfo = await this.googleDriveService.getFileInfo(fileId);
      const fileName = fileInfo.name;
      const codeMatch = fileName.match(/^([a-zA-Z0-9_-]+)\.json$/);

      if (!codeMatch) {
        this.logger.warn(`Skipping file with invalid name: ${fileName}`);
        return null; // Skip files with invalid names
      }

      const code = codeMatch[1];
      return {
        id: fileId,
        name: fileName,
        code: code,
      };
    } catch (error) {
      this.logger.warn(`Failed to get basic info for file: ${fileId}`, error);
      return null;
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
      // Получаем текущее содержимое файла
      const fileContent = await this.googleDriveService.getFileContent(fileId);
      if (!fileContent) return;

      const languageData = JSON.parse(fileContent);
      
      // Добавляем информацию об архивировании
      if (!languageData.metadata) languageData.metadata = {};
      languageData.metadata.archivedAt = new Date().toISOString();
      languageData.metadata.archivedBy = adminUser;
      languageData.metadata.archiveReason = reason;
      languageData.language.isArchived = true;

      // Создаем временный файл для обновления
      const tempPath = path.join(process.cwd(), 'data/languages', `temp-archive-${Date.now()}.json`);
      try {
        fs.writeFileSync(tempPath, JSON.stringify(languageData, null, 2));
        await this.googleDriveService.updateFile(fileId, tempPath);
      } finally {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to update archive metadata for language: ${fileId}`, error);
      // Не прерываем основную операцию архивирования, но логируем ошибку
      this.logger.error(`Archive metadata update failed for language: ${fileId}`, {
        error: error.message,
        errorCode: ErrorCode.ADMIN_LANGUAGE_ARCHIVE_METADATA_UPDATE_FAILED
      });
    }
  }

  /**
   * Обновить метаданные восстановления языка
   */
  private async updateLanguageRestoreMetadata(fileId: string, adminUser: string): Promise<void> {
    try {
      // Получаем текущее содержимое файла
      const fileContent = await this.googleDriveService.getFileContent(fileId);
      if (!fileContent) return;

      const languageData = JSON.parse(fileContent);
      
      // Убираем информацию об архивировании
      if (languageData.metadata) {
        delete languageData.metadata.archivedAt;
        delete languageData.metadata.archivedBy;
        delete languageData.metadata.archiveReason;
      }
      languageData.language.isArchived = false;
      languageData.metadata = languageData.metadata || {};
      languageData.metadata.restoredAt = new Date().toISOString();
      languageData.metadata.restoredBy = adminUser;

      // Создаем временный файл для обновления
      const tempPath = path.join(process.cwd(), 'data/languages', `temp-restore-${Date.now()}.json`);
      try {
        fs.writeFileSync(tempPath, JSON.stringify(languageData, null, 2));
        await this.googleDriveService.updateFile(fileId, tempPath);
      } finally {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to update restore metadata for language: ${fileId}`, error);
      // Не прерываем основную операцию восстановления, но логируем ошибку
      this.logger.error(`Restore metadata update failed for language: ${fileId}`, {
        error: error.message,
        errorCode: ErrorCode.ADMIN_LANGUAGE_RESTORE_METADATA_UPDATE_FAILED
      });
    }
  }
}
