import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ActivityTypesAdminService } from './activity-types-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ActivityTypeDto } from '../../core/activity-types';

@ApiTags('admin/activity-types')
@Controller('admin/activity-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ActivityTypesAdminController {
  constructor(private readonly activityTypesAdminService: ActivityTypesAdminService) {}

  @Post('sync-with-drive')
  @ApiOperation({
    summary: 'Синхронизировать типы активности с Google Drive',
    description: 'Перезагружает типы активности из Google Drive и обновляет кэш',
  })
  @ApiResponse({
    status: 200,
    description: 'Синхронизация завершена',
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
  async syncWithDrive(): Promise<{ success: boolean; message: string }> {
    return this.activityTypesAdminService.syncWithDrive();
  }

  @Get()
  @ApiOperation({
    summary: 'Получить все типы активности',
    description: 'Возвращает все доступные типы активности для администратора. Параметр lang — код языка для подстановки переводов (en, ru, uk).',
  })
  @ApiQuery({
    name: 'lang',
    description: 'Код языка для локализованных названий и описаний (любой код из синхронизированных в админке языков, напр. en, ru, uk, fr). Без параметра — подставляется en; при пустом кэше языков вернутся ключи.',
    required: false,
    example: 'en',
    schema: { type: 'string' },
  })
  @ApiResponse({
    status: 200,
    description: 'Список всех типов активности',
    type: [ActivityTypeDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав (требуются права администратора)',
  })
  async getAllActivityTypes(
    @Query('lang') language?: string,
  ): Promise<ActivityTypeDto[]> {
    return this.activityTypesAdminService.getAllActivityTypes(language);
  }

  @Get('by-category')
  @ApiOperation({
    summary: 'Получить типы активности по категории',
    description: 'Возвращает типы активности, отфильтрованные по категории. Параметр lang — код языка для подстановки переводов.',
  })
  @ApiQuery({
    name: 'category',
    description: 'Категория активности',
    required: true,
  })
  @ApiQuery({
    name: 'lang',
    description: 'Код языка для локализованных названий и описаний',
    required: false,
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'Типы активности по категории',
    type: [ActivityTypeDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав (требуются права администратора)',
  })
  async getActivityTypesByCategory(
    @Query('category') category: string,
    @Query('lang') language?: string,
  ): Promise<ActivityTypeDto[]> {
    return this.activityTypesAdminService.getActivityTypesByCategory(category, language);
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Получить категории активности',
    description: 'Возвращает все доступные категории активности. Параметр lang — код языка для подстановки переводов.',
  })
  @ApiQuery({
    name: 'lang',
    description: 'Код языка для локализованных названий категорий',
    required: false,
    example: 'en',
  })
  @ApiResponse({
    status: 200,
    description: 'Список категорий активности',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'string',
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
  async getActivityCategories(
    @Query('lang') language?: string,
  ) {
    return this.activityTypesAdminService.getActivityCategories(language);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Получить статистику типов активности',
    description: 'Возвращает статистическую информацию о типах активности',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика типов активности',
    schema: {
      type: 'object',
      properties: {
        totalCount: {
          type: 'number',
          description: 'Общее количество типов активности',
        },
        categoryCounts: {
          type: 'object',
          description: 'Количество типов по категориям',
        },
        averageDifficulty: {
          type: 'number',
          description: 'Средняя сложность активности',
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
  async getActivityTypesStats() {
    return this.activityTypesAdminService.getActivityTypesStats();
  }
}
