import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GoogleDriveFilesService {
  private readonly logger = new Logger(GoogleDriveFilesService.name);
  private drive: any;

  constructor(private configService: ConfigService) {
    this.initializeGoogleDrive();
  }

  /**
   * Инициализация Google Drive API
   */
  private async initializeGoogleDrive() {
    try {
      const keyFilePath = this.configService.get<string>('GOOGLE_DRIVE_KEY_FILE');
      
      if (!keyFilePath || !fs.existsSync(keyFilePath)) {
        this.logger.warn('Google Drive key file not found, file operations will be disabled');
        return;
      }

      const keyFileContent = fs.readFileSync(keyFilePath, 'utf8');
      const credentials = JSON.parse(keyFileContent);

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });

      this.drive = google.drive({ version: 'v3', auth });
      this.logger.log('Google Drive API initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Drive API', error);
    }
  }

  /**
   * Получить содержимое файла по ID
   */
  async getFileContent(fileId: string): Promise<any> {
    if (!this.drive) {
      throw new BadRequestException('Google Drive API not initialized');
    }

    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media',
      });

      const content = response.data;
      
      // Если это JSON файл, парсим его
      if (typeof content === 'string') {
        try {
          return JSON.parse(content);
        } catch (parseError) {
          return content;
        }
      }

      return content;
    } catch (error) {
      this.logger.error(`Failed to get file content: ${fileId}`, error);
      throw new BadRequestException('Failed to get file content from Google Drive');
    }
  }

  /**
   * Получить метаданные файла
   */
  async getFileMetadata(fileId: string): Promise<any> {
    if (!this.drive) {
      throw new BadRequestException('Google Drive API not initialized');
    }

    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id,name,mimeType,modifiedTime,size,webViewLink',
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get file metadata: ${fileId}`, error);
      throw new BadRequestException('Failed to get file metadata from Google Drive');
    }
  }

  /**
   * Обновить содержимое файла
   */
  async updateFileContent(fileId: string, content: any): Promise<void> {
    if (!this.drive) {
      throw new BadRequestException('Google Drive API not initialized');
    }

    try {
      const contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      
      await this.drive.files.update({
        fileId,
        media: {
          mimeType: 'application/json',
          body: contentString,
        },
      });

      this.logger.log(`File updated successfully: ${fileId}`);
    } catch (error) {
      this.logger.error(`Failed to update file: ${fileId}`, error);
      throw new BadRequestException('Failed to update file in Google Drive');
    }
  }

  /**
   * Создать новый файл
   */
  async createFile(fileName: string, content: any, folderId?: string): Promise<string> {
    if (!this.drive) {
      throw new BadRequestException('Google Drive API not initialized');
    }

    try {
      const contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      
      const fileMetadata = {
        name: fileName,
        mimeType: 'application/json',
        ...(folderId && { parents: [folderId] }),
      };

      const media = {
        mimeType: 'application/json',
        body: contentString,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id',
      });

      const fileId = response.data.id;
      this.logger.log(`File created successfully: ${fileName} with ID: ${fileId}`);
      
      return fileId;
    } catch (error) {
      this.logger.error(`Failed to create file: ${fileName}`, error);
      throw new BadRequestException('Failed to create file in Google Drive');
    }
  }

  /**
   * Удалить файл
   */
  async deleteFile(fileId: string): Promise<void> {
    if (!this.drive) {
      throw new BadRequestException('Google Drive API not initialized');
    }

    try {
      await this.drive.files.delete({
        fileId,
      });

      this.logger.log(`File deleted successfully: ${fileId}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${fileId}`, error);
      throw new BadRequestException('Failed to delete file from Google Drive');
    }
  }

  /**
   * Проверить, доступен ли Google Drive API
   */
  isAvailable(): boolean {
    return !!this.drive;
  }

  /**
   * Получить информацию о доступности сервиса
   */
  getServiceStatus(): { available: boolean; message: string } {
    if (this.drive) {
      return {
        available: true,
        message: 'Google Drive API is available',
      };
    }

    return {
      available: false,
      message: 'Google Drive API is not available - check configuration',
    };
  }
}
