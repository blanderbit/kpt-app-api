import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BackupDatabaseService } from './backup.database.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('admin/backup')
@Controller('admin/backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BackupController {
  constructor(private readonly backupDatabaseService: BackupDatabaseService) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Создать бэкап базы данных',
    description: 'Создает бэкап базы данных MySQL и загружает его на Google Drive',
  })
  @ApiResponse({
    status: 200,
    description: 'Бэкап создан и загружен успешно',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Статус успешности операции',
        },
        backupPath: {
          type: 'string',
          description: 'Путь к локальному файлу бэкапа',
        },
        fileId: {
          type: 'string',
          description: 'ID файла в Google Drive',
        },
        message: {
          type: 'string',
          description: 'Сообщение о результате операции',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав (требуются права администратора)',
  })
  @ApiResponse({
    status: 500,
    description: 'Ошибка создания бэкапа',
  })
  async createBackup() {
    return this.backupDatabaseService.createAndUploadBackup();
  }

  @Post('create-local')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Создать локальный бэкап базы данных',
    description: 'Создает бэкап базы данных MySQL только локально (без загрузки на Google Drive)',
  })
  @ApiResponse({
    status: 200,
    description: 'Локальный бэкап создан успешно',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Статус успешности операции',
        },
        backupPath: {
          type: 'string',
          description: 'Путь к файлу бэкапа',
        },
        message: {
          type: 'string',
          description: 'Сообщение о результате операции',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав (требуются права администратора)',
  })
  @ApiResponse({
    status: 500,
    description: 'Ошибка создания бэкапа',
  })
  async createLocalBackup() {
    return this.backupDatabaseService.createDatabaseBackup();
  }

  @Get('list')
  @ApiOperation({
    summary: 'Получить список бэкапов',
    description: 'Возвращает список всех бэкапов, хранящихся на Google Drive',
  })
  @ApiResponse({
    status: 200,
    description: 'Список бэкапов получен успешно',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Статус успешности операции',
        },
        backups: {
          type: 'array',
          description: 'Список файлов бэкапов',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: 'ID файла в Google Drive',
              },
              name: {
                type: 'string',
                description: 'Имя файла',
              },
              size: {
                type: 'number',
                description: 'Размер файла в байтах',
              },
              createdTime: {
                type: 'string',
                description: 'Время создания файла',
              },
              modifiedTime: {
                type: 'string',
                description: 'Время последнего изменения файла',
              },
            },
          },
        },
        message: {
          type: 'string',
          description: 'Сообщение о результате операции',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав (требуются права администратора)',
  })
  @ApiResponse({
    status: 500,
    description: 'Ошибка получения списка бэкапов',
  })
  async listBackups() {
    return this.backupDatabaseService.listBackups();
  }

  @Get('download/:fileId')
  @ApiOperation({
    summary: 'Скачать бэкап',
    description: 'Скачивает бэкап с Google Drive по ID файла',
  })
  @ApiParam({
    name: 'fileId',
    description: 'ID файла в Google Drive',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Бэкап скачан успешно',
    content: {
      'application/sql': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав (требуются права администратора)',
  })
  @ApiResponse({
    status: 404,
    description: 'Файл бэкапа не найден',
  })
  @ApiResponse({
    status: 500,
    description: 'Ошибка скачивания бэкапа',
  })
  async downloadBackup(@Param('fileId') fileId: string, @Res() res: Response) {
    const result = await this.backupDatabaseService.downloadBackup(fileId);
    
    if (!result.success) {
      return res.status(500).json({ message: 'Failed to download backup' });
    }

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.send(result.fileContent);
  }

  @Post('restore/:fileName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Восстановить базу данных из бэкапа',
    description: 'Восстанавливает базу данных из бэкапа по имени файла',
  })
  @ApiParam({
    name: 'fileName',
    description: 'Имя файла бэкапа (например: kpt-backup-2024-01-15T10-30-00-000Z.sql)',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'База данных восстановлена успешно',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Статус успешности операции',
        },
        message: {
          type: 'string',
          description: 'Сообщение о результате операции',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав (требуются права администратора)',
  })
  @ApiResponse({
    status: 404,
    description: 'Файл бэкапа не найден',
  })
  @ApiResponse({
    status: 500,
    description: 'Ошибка восстановления базы данных',
  })
  async restoreDatabase(@Param('fileName') fileName: string) {
    return this.backupDatabaseService.restoreDatabaseFromBackup(fileName);
  }

  @Get('health')
  @ApiOperation({
    summary: 'Проверить состояние сервиса бэкапов',
    description: 'Проверяет доступность mysqldump и Google Drive сервиса',
  })
  @ApiResponse({
    status: 200,
    description: 'Состояние сервиса',
    schema: {
      type: 'object',
      properties: {
        mysqldumpAvailable: {
          type: 'boolean',
          description: 'Доступность mysqldump',
        },
        googleDriveAvailable: {
          type: 'boolean',
          description: 'Доступность Google Drive',
        },
        message: {
          type: 'string',
          description: 'Сообщение о состоянии',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав (требуются права администратора)',
  })
  async healthCheck() {
    const mysqldumpAvailable = await this.backupDatabaseService.checkMysqldumpAvailability();
    const googleDriveAvailable = await this.backupDatabaseService['googleDriveService'].testConnection();

    return {
      mysqldumpAvailable,
      googleDriveAvailable,
      message: `mysqldump: ${mysqldumpAvailable ? 'available' : 'not available'}, Google Drive: ${googleDriveAvailable ? 'available' : 'not available'}`
    };
  }
}
