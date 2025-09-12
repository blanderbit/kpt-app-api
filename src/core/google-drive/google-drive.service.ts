import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { google } from 'googleapis';
import { googleDriveConfig } from '../../config/google.config';
import * as fs from 'fs';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private drive: any;

  constructor() {
    this.initializeGoogleDrive();
  }

  /**
   * Инициализация Google Drive API
   */
  private async initializeGoogleDrive() {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: googleDriveConfig,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.logger.log('Google Drive API initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Drive API', error);
      throw new BadRequestException('Google Drive API initialization failed');
    }
  }

  /**
   * Создать папку в Google Drive
   */
  async createFolder(folderName: string, parentFolderId?: string): Promise<string> {
    try {
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentFolderId && { parents: [parentFolderId] }),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
      });

      this.logger.log(`Created folder: ${folderName} with ID: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      this.logger.error(`Failed to create folder: ${folderName}`, error);
      throw new BadRequestException(`Failed to create folder: ${folderName}`);
    }
  }

  /**
   * Загрузить файл в Google Drive
   */
  async uploadFile(filePath: string, fileName: string, folderId?: string): Promise<{ fileId: string; fileUrl: string }> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException(`File not found: ${filePath}`);
      }

      const fileMetadata = {
        name: fileName,
        ...(folderId && { parents: [folderId] }),
      };

      const media = {
        mimeType: 'application/json',
        body: fs.createReadStream(filePath),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        supportsAllDrives: true,
        supportsTeamDrives: true,
        fields: 'id, webViewLink',
      });

      this.logger.log(`Uploaded file: ${fileName} with ID: ${response.data.id}`);
      
      return {
        fileId: response.data.id,
        fileUrl: response.data.webViewLink,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${fileName}`, error);
      throw new BadRequestException(`Failed to upload file: ${fileName}`);
    }
  }

  /**
   * Обновить файл в Google Drive
   */
  async updateFile(fileId: string, filePath: string): Promise<{ fileId: string; fileUrl: string }> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException(`File not found: ${filePath}`);
      }

      const media = {
        mimeType: 'application/json',
        body: fs.createReadStream(filePath),
      };

      const response = await this.drive.files.update({
        fileId: fileId,
        media: media,
        fields: 'id, webViewLink',
      });

      this.logger.log(`Updated file with ID: ${response.data.id}`);
      
      return {
        fileId: response.data.id,
        fileUrl: response.data.webViewLink,
      };
    } catch (error) {
      this.logger.error(`Failed to update file: ${fileId}`, error);
      throw new BadRequestException(`Failed to update file: ${fileId}`);
    }
  }

  /**
   * Скачать файл из Google Drive
   */
  async downloadFile(fileId: string, localPath: string): Promise<void> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media',
      }, { responseType: 'stream' });

      const dest = fs.createWriteStream(localPath);
      response.data.pipe(dest);

      return new Promise((resolve, reject) => {
        dest.on('finish', () => {
          this.logger.log(`Downloaded file to: ${localPath}`);
          resolve();
        });
        dest.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Failed to download file: ${fileId}`, error);
      throw new BadRequestException(`Failed to download file: ${fileId}`);
    }
  }

  /**
   * Удалить файл из Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId: fileId,
      });

      this.logger.log(`Deleted file with ID: ${fileId}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${fileId}`, error);
      throw new BadRequestException(`Failed to delete file: ${fileId}`);
    }
  }

  /**
   * Переместить файл в архивную папку
   */
  async moveToArchive(fileId: string, archiveFolderId: string): Promise<void> {
    try {
      // Получаем текущие родительские папки
      const file = await this.drive.files.get({
        fileId: fileId,
        fields: 'parents',
      });

      const previousParents = file.data.parents?.join(',') || '';

      // Перемещаем файл в архивную папку
      await this.drive.files.update({
        fileId: fileId,
        addParents: archiveFolderId,
        removeParents: previousParents,
        fields: 'id, parents',
      });

      this.logger.log(`Moved file ${fileId} to archive folder ${archiveFolderId}`);
    } catch (error) {
      this.logger.error(`Failed to move file to archive: ${fileId}`, error);
      throw new BadRequestException(`Failed to move file to archive: ${fileId}`);
    }
  }

  /**
   * Получить список файлов в папке
   */
  async listFiles(folderId: string): Promise<Array<{ id: string; name: string; mimeType: string; webViewLink: string }>> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, webViewLink)',
      });

      return response.data.files || [];
    } catch (error) {
      this.logger.error(`Failed to list files in folder: ${folderId}`, error);
      throw new BadRequestException(`Failed to list files in folder: ${folderId}`);
    }
  }

  /**
   * Получить информацию о файле
   */
  async getFileInfo(fileId: string): Promise<{ id: string; name: string; mimeType: string; webViewLink: string; size: string }> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, webViewLink, size',
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get file info: ${fileId}`, error);
      throw new BadRequestException(`Failed to get file info: ${fileId}`);
    }
  }

  /**
   * Получить содержимое файла напрямую
   */
  async getFileContent(fileId: string): Promise<string> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media',
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get file content: ${fileId}`, error);
      throw new BadRequestException(`Failed to get file content: ${fileId}`);
    }
  }

  /**
   * Создать или получить корневую папку для языков
   */
  async getOrCreateLanguagesRootFolder(): Promise<string> {
    try {
      // Пытаемся получить существующую папку из переменной окружения
      const rootFolderId = process.env.LANGUAGES_FOLDER_ID;
      
      if (rootFolderId) {
        try {
          await this.drive.files.get({ fileId: rootFolderId });
          this.logger.log('Using existing root folder for languages from environment');
          return rootFolderId;
        } catch (error) {
          this.logger.warn('Configured root folder not found, creating new one');
        }
      }

      const folderName = 'KPT App Languages';
      
      // Ищем существующую папку
      const response = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
      });

      if (response.data.files && response.data.files.length > 0) {
        const folderId = response.data.files[0].id;
        this.logger.log(`Found existing root folder for languages: ${folderName} with ID: ${folderId}`);
        this.logger.warn(`Please update LANGUAGES_FOLDER_ID in your environment to: ${folderId}`);
        return folderId;
      }

      // Создаем новую папку
      const folderId = await this.createFolder(folderName);
      this.logger.log(`Created new root folder for languages: ${folderName} with ID: ${folderId}`);
      this.logger.warn(`Please update LANGUAGES_FOLDER_ID in your environment to: ${folderId}`);
      
      return folderId;
    } catch (error) {
      this.logger.error('Failed to get or create languages root folder', error);
      throw new BadRequestException('Failed to setup languages root folder');
    }
  }

  /**
   * Создать или получить архивную папку
   */
  async getOrCreateArchiveFolder(rootFolderId: string): Promise<string> {
    try {
      const folderName = 'Archived Languages';
      
      // Ищем существующую папку
      const response = await this.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${rootFolderId}' in parents and trashed=false`,
        fields: 'files(id)',
      });

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // Создаем новую папку
      return await this.createFolder(folderName, rootFolderId);
    } catch (error) {
      this.logger.error('Failed to get or create archive folder', error);
      throw new BadRequestException('Failed to get or create archive folder');
    }
  }

  /**
   * Проверить доступность Google Drive API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.drive.about.get({
        fields: 'user',
      });
      return true;
    } catch (error) {
      this.logger.error('Google Drive API connection test failed', error);
      return false;
    }
  }
}
