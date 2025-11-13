import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { GoogleDriveService } from '../../core/google-drive';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { databaseConfig } from '../../config/database.config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

const BACKUP_FOLDER_ID = "1Mit8JYzXVoreAYMjpY8RZlFV4-ZAoVC8" as any ; //|| process.env.BACKUP_FOLDER_ID

@Injectable()
export class BackupDatabaseService {
  private readonly logger = new Logger(BackupDatabaseService.name);
  private readonly backupFolderId: string;
  private readonly dbConfig: {
    host: string;
    port: string;
    username: string;
    password: string;
    database: string;
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly googleDriveService: GoogleDriveService,
  ) {
    this.backupFolderId = BACKUP_FOLDER_ID || '';
    this.dbConfig = this.getDatabaseConfig();
  }

  /**
   * Ежедневный бэкап и очистка старых файлов
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleScheduledBackup() {
    this.logger.log('Starting daily backup process...');
    try {
      const backupResult = await this.createDatabaseBackup();
      await this.uploadBackupToGoogleDrive(backupResult.backupPath);
      await this.cleanupOldBackupsOnDrive();
      await this.cleanupLocalBackups();
      this.logger.log('Daily backup process completed.');
    } catch (error) {
      this.logger.error('Daily backup process failed:', error);
    }
  }

  /**
   * Создает бэкап базы данных MySQL
   */
  async createDatabaseBackup(): Promise<{ success: boolean; backupPath: string; message: string }> {
    try {
      this.logger.log('Starting database backup...');

      // Используем конфигурацию базы данных из свойства класса
      
      // Создаем имя файла бэкапа
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `kpt-backup-${timestamp}.sql`;
      const backupPath = path.join(process.cwd(), 'backups', backupFileName);

      // Создаем папку для бэкапов если не существует
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Создаем команду mysqldump
      const mysqldumpCommand = this.buildMysqldumpCommand(this.dbConfig, backupPath);

      this.logger.log(`Executing mysqldump command: ${mysqldumpCommand.replace(/--password=\S+/g, '--password=***')}`);

      // Выполняем бэкап
      const { stdout, stderr } = await execAsync(mysqldumpCommand);

      if (stderr && !stderr.includes('Warning')) {
        throw new Error(`mysqldump error: ${stderr}`);
      }

      // Проверяем, что файл создался
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file was not created');
      }

      const fileStats = fs.statSync(backupPath);
      this.logger.log(`Database backup created successfully: ${backupPath} (${fileStats.size} bytes)`);

      return {
        success: true,
        backupPath,
        message: `Database backup created successfully: ${backupFileName}`
      };

    } catch (error) {
      this.logger.error('Database backup failed:', error);
      throw AppException.internal(ErrorCode.BACKUP_DATABASE_FAILED, undefined, {
        error: error.message
      });
    }
  }

  /**
   * Загружает бэкап на Google Drive
   */
  async uploadBackupToGoogleDrive(backupPath: string): Promise<{ success: boolean; fileId: string; message: string }> {
    try {
      this.logger.log('Uploading backup to Google Drive...');

      // Проверяем доступность Google Drive через тест соединения
      const isAvailable = await this.googleDriveService.testConnection();
      if (!isAvailable) {
        throw new Error('Google Drive service is not available');
      }

      if (!this.backupFolderId) {
        throw new Error('Backup folder ID is not configured');
      }

      const fileName = path.basename(backupPath);

      // Загружаем на Google Drive (метод принимает filePath, fileName, folderId)
      const uploadResult = await this.googleDriveService.uploadFile(
        backupPath,
        fileName,
        this.backupFolderId
      );
      
      const fileId = uploadResult.fileId;

      this.logger.log(`Backup uploaded to Google Drive successfully. File ID: ${fileId}`);

      return {
        success: true,
        fileId,
        message: `Backup uploaded to Google Drive successfully: ${fileName}`
      };

    } catch (error) {
      this.logger.error('Failed to upload backup to Google Drive:', error);
      throw AppException.internal(ErrorCode.BACKUP_UPLOAD_FAILED, undefined, {
        error: error.message
      });
    }
  }

  /**
   * Создает бэкап и загружает его на Google Drive
   */
  async createAndUploadBackup(): Promise<{ success: boolean; backupPath: string; fileId: string; message: string }> {
    try {
      // Создаем бэкап
      const backupResult = await this.createDatabaseBackup();
      
      if (!backupResult.success) {
        throw new Error('Failed to create database backup');
      }

      // Загружаем на Google Drive
      const uploadResult = await this.uploadBackupToGoogleDrive(backupResult.backupPath);
      
      if (!uploadResult.success) {
        throw new Error('Failed to upload backup to Google Drive');
      }

      // Удаляем локальный файл после успешной загрузки
      try {
        fs.unlinkSync(backupResult.backupPath);
        this.logger.log('Local backup file deleted after successful upload');
      } catch (deleteError) {
        this.logger.warn('Failed to delete local backup file:', deleteError);
      }

      // Очищаем всю локальную папку backups
      await this.cleanupLocalBackups();

      return {
        success: true,
        backupPath: backupResult.backupPath,
        fileId: uploadResult.fileId,
        message: 'Backup created and uploaded to Google Drive successfully'
      };

    } catch (error) {
      this.logger.error('Backup creation and upload failed:', error);
      throw AppException.internal(ErrorCode.BACKUP_CREATION_AND_UPLOAD_FAILED, undefined, {
        error: error.message
      });
    }
  }

  /**
   * Получает список бэкапов с Google Drive
   */
  async listBackups(): Promise<{ success: boolean; backups: any[]; message: string }> {
    try {
      this.logger.log('Listing backups from Google Drive...');

      // Проверяем доступность Google Drive через тест соединения
      const isAvailable = await this.googleDriveService.testConnection();
      if (!isAvailable) {
        throw new Error('Google Drive service is not available');
      }

      if (!this.backupFolderId) {
        throw new Error('Backup folder ID is not configured');
      }

      const files = await this.googleDriveService.listFiles(this.backupFolderId);
      
      // Фильтруем только файлы бэкапов
      const backupFiles = files.filter(file => 
        file.name.startsWith('kpt-backup-') && file.name.endsWith('.sql')
      );

      this.logger.log(`Found ${backupFiles.length} backup files`);

      return {
        success: true,
        backups: backupFiles,
        message: `Found ${backupFiles.length} backup files`
      };

    } catch (error) {
      this.logger.error('Failed to list backups:', error);
      throw AppException.internal(ErrorCode.BACKUP_LIST_FAILED, undefined, {
        error: error.message
      });
    }
  }

  /**
   * Скачивает бэкап с Google Drive
   */
  async downloadBackup(fileId: string): Promise<{ success: boolean; fileContent: Buffer; fileName: string; message: string }> {
    try {
      this.logger.log(`Downloading backup from Google Drive: ${fileId}`);

      // Проверяем доступность Google Drive через тест соединения
      const isAvailable = await this.googleDriveService.testConnection();
      if (!isAvailable) {
        throw new Error('Google Drive service is not available');
      }

      // Создаем временный файл для скачивания
      const tempPath = path.join(process.cwd(), 'temp', `temp-backup-${fileId}.sql`);
      const tempDir = path.dirname(tempPath);
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Скачиваем файл
      await this.googleDriveService.downloadFile(fileId, tempPath);
      
      // Читаем содержимое файла
      const fileContent = fs.readFileSync(tempPath);
      const fileInfo = await this.googleDriveService.getFileInfo(fileId);
      
      // Удаляем временный файл
      fs.unlinkSync(tempPath);

      this.logger.log(`Backup downloaded successfully: ${fileInfo.name}`);

      return {
        success: true,
        fileContent,
        fileName: fileInfo.name,
        message: `Backup downloaded successfully: ${fileInfo.name}`
      };

    } catch (error) {
      this.logger.error('Failed to download backup:', error);
      throw AppException.internal(ErrorCode.BACKUP_DOWNLOAD_FAILED, undefined, {
        error: error.message,
        fileId
      });
    }
  }

  /**
   * Восстанавливает базу данных из бэкапа по имени файла
   */
  async restoreDatabaseFromBackup(backupFileName: string): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Starting database restore from backup: ${backupFileName}`);

      // Используем конфигурацию базы данных из свойства класса

      // Находим файл бэкапа на Google Drive
      const files = await this.googleDriveService.listFiles(this.backupFolderId);
      const backupFile = files.find(file => file.name === backupFileName);

      if (!backupFile) {
        throw new Error(`Backup file not found: ${backupFileName}`);
      }

      // Скачиваем бэкап
      const downloadResult = await this.downloadBackup(backupFile.id);
      
      if (!downloadResult.success) {
        throw new Error('Failed to download backup file');
      }

      // Создаем временный файл для восстановления
      const tempPath = path.join(process.cwd(), 'temp', `restore-${backupFileName}`);
      const tempDir = path.dirname(tempPath);
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Записываем содержимое во временный файл
      fs.writeFileSync(tempPath, downloadResult.fileContent);

      // Создаем команду восстановления
      const restoreCommand = this.buildRestoreCommand(this.dbConfig, tempPath);

      this.logger.log(`Executing restore command: ${restoreCommand.replace(/--password=\S+/g, '--password=***')}`);

      // Выполняем восстановление
      const { stdout, stderr } = await execAsync(restoreCommand);

      if (stderr && !stderr.includes('Warning')) {
        throw new Error(`mysql restore error: ${stderr}`);
      }

      // Удаляем временный файл
      fs.unlinkSync(tempPath);

      this.logger.log(`Database restored successfully from backup: ${backupFileName}`);

      return {
        success: true,
        message: `Database restored successfully from backup: ${backupFileName}`
      };

    } catch (error) {
      this.logger.error('Database restore failed:', error);
      throw AppException.internal(ErrorCode.BACKUP_RESTORE_FAILED, undefined, {
        error: error.message,
        backupFileName
      });
    }
  }

  /**
   * Очищает старые бэкапы на Google Drive (удаляет файлы старше 15 дней)
   */
  async cleanupOldBackupsOnDrive(): Promise<void> {
    try {
      this.logger.log('Cleaning up old backups on Google Drive (older than 15 days)...');

      const files = await this.googleDriveService.listFiles(this.backupFolderId);
      const backupFiles = files.filter(file => 
        file.name.startsWith('kpt-backup-') && file.name.endsWith('.sql')
      );

      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      let deletedCount = 0;

      for (const file of backupFiles) {
        try {
          // Используем modifiedTime из объекта файла (более надежно, чем парсинг имени)
          const modifiedTime = (file as any).modifiedTime;
          
          if (modifiedTime) {
            const fileDate = new Date(modifiedTime);
            
            if (fileDate < fifteenDaysAgo) {
              await this.googleDriveService.deleteFile(file.id);
              this.logger.log(`Deleted old backup: ${file.name} (modified: ${fileDate.toISOString()})`);
              deletedCount++;
            }
          } else {
            // Fallback: если modifiedTime недоступен, пытаемся извлечь дату из имени файла
            const fileName = file.name;
            const dateMatch = fileName.match(/kpt-backup-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.sql/);
            
            if (dateMatch) {
              // Преобразуем формат из имени файла в ISO формат
              // Формат в имени: 2024-01-15T10-30-00-000Z -> ISO: 2024-01-15T10:30:00.000Z
              const dateStr = dateMatch[1].replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, 'T$1:$2:$3.$4Z');
              const fileDate = new Date(dateStr);
              
              if (fileDate < fifteenDaysAgo) {
                await this.googleDriveService.deleteFile(file.id);
                this.logger.log(`Deleted old backup: ${file.name} (parsed from filename: ${fileDate.toISOString()})`);
                deletedCount++;
              }
            } else {
              this.logger.warn(`Could not determine date for backup file: ${file.name} (no modifiedTime and cannot parse filename)`);
            }
          }
        } catch (error) {
          this.logger.warn(`Failed to delete old backup ${file.name}:`, error);
        }
      }

      this.logger.log(`Cleanup completed. Deleted ${deletedCount} backup files older than 15 days`);

    } catch (error) {
      this.logger.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Очищает локальную папку backups
   */
  async cleanupLocalBackups(): Promise<void> {
    try {
      this.logger.log('Cleaning up local backups folder...');

      const backupDir = path.join(process.cwd(), 'backups');
      
      if (!fs.existsSync(backupDir)) {
        this.logger.log('Backups directory does not exist, nothing to clean');
        return;
      }

      const files = fs.readdirSync(backupDir);
      let deletedCount = 0;

      for (const file of files) {
        try {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isFile() && file.startsWith('kpt-backup-') && file.endsWith('.sql')) {
            fs.unlinkSync(filePath);
            this.logger.log(`Deleted local backup file: ${file}`);
            deletedCount++;
          }
        } catch (error) {
          this.logger.warn(`Failed to delete local backup file ${file}:`, error);
        }
      }

      this.logger.log(`Local cleanup completed. Deleted ${deletedCount} local backup files`);

    } catch (error) {
      this.logger.error('Failed to cleanup local backups:', error);
    }
  }

  /**
   * Получает конфигурацию базы данных (вызывается только в конструкторе)
   */
  private getDatabaseConfig() {
    const host = (databaseConfig as any).host || 'localhost';
    const port = (databaseConfig as any).port || '3306';
    const username = (databaseConfig as any).username || 'root';
    const password = (databaseConfig as any).password || '';
    const database = (databaseConfig as any).database || 'kpt';

    return { host, port, username, password, database };
  }

  /**
   * Строит команду mysqldump
   */
  private buildMysqldumpCommand(dbConfig: any, outputPath: string): string {
    const { host, port, username, password, database } = dbConfig;
    
    const command = [
      'mysqldump',
      `--host=${host}`,
      `--port=${port}`,
      `--user=${username}`,
      `--password=${password}`,
      '--single-transaction',
      '--routines',
      '--triggers',
      '--events',
      '--hex-blob',
      '--add-drop-database',
      '--add-drop-table',
      '--add-locks',
      '--disable-keys',
      '--extended-insert',
      '--quick',
      '--lock-tables=false',
      '--no-tablespaces',
      database,
      `> ${outputPath}`
    ];

    return command.join(' ');
  }

  /**
   * Строит команду восстановления базы данных
   */
  private buildRestoreCommand(dbConfig: any, backupPath: string): string {
    const { host, port, username, password, database } = dbConfig;
    
    const command = [
      'mysql',
      `--host=${host}`,
      `--port=${port}`,
      `--user=${username}`,
      `--password=${password}`,
      database,
      `< ${backupPath}`
    ];

    return command.join(' ');
  }

  /**
   * Проверяет доступность mysqldump
   */
  async checkMysqldumpAvailability(): Promise<boolean> {
    try {
      await execAsync('mysqldump --version');
      return true;
    } catch (error) {
      this.logger.warn('mysqldump is not available:', error.message);
      return false;
    }
  }
}