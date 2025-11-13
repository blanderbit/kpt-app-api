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
   * Загрузить файл в Google Drive
   */
  async uploadFile(filePath: string, fileName: string, folderId?: string, appProperties?: any): Promise<{ fileId: string; fileUrl: string }> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException(`File not found: ${filePath}`);
      }

      const fileMetadata = {
        name: fileName,
        mimeType: 'application/json',
        appProperties: appProperties ? appProperties : {},
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
   * Обновить appProperties файла в Google Drive
   */
  async updateFileProperties(fileId: string, appProperties: any): Promise<void> {
    try {
      await this.drive.files.update({
        fileId: fileId,
        requestBody: {
          appProperties: appProperties,
        },
        fields: 'id, appProperties',
        supportsAllDrives: true,
      });

      this.logger.log(`Updated appProperties for file: ${fileId}`);
    } catch (error) {
      this.logger.error(`Failed to update appProperties for file: ${fileId}`, error);
      throw new BadRequestException(`Failed to update appProperties for file: ${fileId}`);
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

      // Проверяем, существует ли файл в Google Drive
      const media = {
        mimeType: 'application/json',
        body: fs.createReadStream(filePath),
      };

      this.logger.log(`Updating file ${fileId} with content from ${filePath}`);
      
      const response = await this.drive.files.update({
        fileId: fileId,
        media: media,
        fields: 'id, webViewLink',
        supportsAllDrives: true,
      });

      this.logger.log(`Updated file with ID: ${response.data.id}`);
      
      return {
        fileId: response.data.id,
        fileUrl: response.data.webViewLink,
      };
    } catch (error) {
      this.logger.error(`Failed to update file: ${fileId}`, error);
      if (error.response) {
        this.logger.error(`Google Drive API error: ${JSON.stringify(error.response.data)}`);
      }
      throw new BadRequestException(`Failed to update file: ${fileId} - ${error.message}`);
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
        supportsAllDrives: true,
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
  async moveToArchive(fileId: string, archiveFolderId: string, fileInfo?: { parents?: string[] }): Promise<void> {
    try {
      // Используем переданный fileInfo или получаем новый
      const file = fileInfo || await this.getFileInfo(fileId);

      const previousParents = file.parents?.join(',') || '';

      // Перемещаем файл в архивную папку
      await this.drive.files.update({
        fileId: fileId,
        addParents: archiveFolderId,
        removeParents: previousParents,
        fields: 'id, parents',
        supportsAllDrives: true,
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
  async listFiles(folderId: string): Promise<Array<{ id: string; name: string; mimeType: string; webViewLink: string; appProperties?: any }>> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id,name,mimeType,size,modifiedTime,appProperties),nextPageToken',
        pageSize: 1000,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
      });

      return response.data.files || [] as any;
    } catch (error) {
      this.logger.error(`Failed to list files in folder: ${folderId}`, error);
      throw new BadRequestException(`Failed to list files in folder: ${folderId}`);
    }
  }

  /**
   * Получить информацию о файле
   */
  async getFileInfo(fileId: string): Promise<{ id: string; name: string; mimeType: string; webViewLink: string; size: string; appProperties?: any; parents?: string[] }> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, webViewLink, size, appProperties, parents',
        supportsAllDrives: true,
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
        supportsAllDrives: true,
      }, { responseType: 'stream' });

      // Преобразуем поток в строку
      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let timeoutId: NodeJS.Timeout;
        
        // Устанавливаем таймаут (30 секунд)
        timeoutId = setTimeout(() => {
          reject(new Error('Timeout: File content download took too long'));
        }, 30000);
        
        response.data.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });
        
        response.data.on('end', () => {
          clearTimeout(timeoutId);
          try {
            const content = Buffer.concat(chunks).toString('utf8');
            resolve(content);
          } catch (error) {
            reject(new Error(`Failed to convert stream to string: ${error.message}`));
          }
        });
        
        response.data.on('error', (error: any) => {
          clearTimeout(timeoutId);
          reject(new Error(`Stream error: ${error.message}`));
        });
      });
    } catch (error) {
      this.logger.error(`Failed to get file content: ${fileId}`, error);
      throw new BadRequestException(`Failed to get file content: ${fileId}`);
    }
  }

  /**
   * Получить корневую папку для языков
   */
  async getLanguagesRootFolder(): Promise<string> {
    try {
      const rootFolderId = process.env.LANGUAGES_FOLDER_ID;
      
      if (!rootFolderId) {
        throw new BadRequestException('LANGUAGES_FOLDER_ID environment variable is not set');
      }

      // Проверяем, что папка существует
      await this.drive.files.get({ 
        fileId: rootFolderId,
        fields: 'id,name,mimeType,driveId,parents,webViewLink,capabilities',
        supportsAllDrives: true,
      });
      
      return rootFolderId;
      
    } catch (error) {
      this.logger.error('Failed to get languages root folder', error);
      throw new BadRequestException('Failed to get languages root folder. Please check LANGUAGES_FOLDER_ID environment variable.');
    }
  }

  /**
   * Получить архивную папку
   */
  async getArchiveFolder(): Promise<string> {
    try {
      const archiveFolderId = process.env.ARCHIVE_FOLDER_ID;
      
      if (!archiveFolderId) {
        throw new BadRequestException('ARCHIVE_FOLDER_ID environment variable is not set');
      }

      // Проверяем, что папка существует
      await this.drive.files.get({ 
        fileId: archiveFolderId,
        fields: 'id,name,mimeType,driveId,parents,webViewLink,capabilities',
        supportsAllDrives: true,
      });
      
      return archiveFolderId;
      
    } catch (error) {
      this.logger.error('Failed to get archive folder', error);
      throw new BadRequestException('Failed to get archive folder. Please check ARCHIVE_FOLDER_ID environment variable.');
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
