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
import { MoodTypesAdminService } from './mood-types-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MoodTypeDto } from '../../core/mood-types';

@ApiTags('admin/mood-types')
@Controller('admin/mood-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MoodTypesAdminController {
  constructor(private readonly moodTypesAdminService: MoodTypesAdminService) {}

  @Post('sync-with-drive')
  @ApiOperation({
    summary: 'Синхронизировать типы настроения с Google Drive',
    description: 'Перезагружает типы настроения из Google Drive и обновляет кэш',
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
    return this.moodTypesAdminService.syncWithDrive();
  }

  @Get()
  @ApiOperation({
    summary: 'Получить все типы настроения',
    description: 'Возвращает все доступные типы настроения для администратора',
  })
  @ApiResponse({
    status: 200,
    description: 'Список всех типов настроения',
    type: [MoodTypeDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав (требуются права администратора)',
  })
  async getAllMoodTypes(): Promise<MoodTypeDto[]> {
    return this.moodTypesAdminService.getAllMoodTypes();
  }

  @Get('by-category')
  @ApiOperation({
    summary: 'Получить типы настроения по категории',
    description: 'Возвращает типы настроения, отфильтрованные по категории',
  })
  @ApiQuery({
    name: 'category',
    description: 'Категория настроения',
    enum: ['positive', 'neutral', 'negative'],
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Типы настроения по категории',
    type: [MoodTypeDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  @ApiResponse({
    status: 403,
    description: 'Недостаточно прав (требуются права администратора)',
  })
  async getMoodTypesByCategory(
    @Query('category') category: string,
  ): Promise<MoodTypeDto[]> {
    return this.moodTypesAdminService.getMoodTypesByCategory(category);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Получить статистику типов настроения',
    description: 'Возвращает статистическую информацию о типах настроения',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика типов настроения',
    schema: {
      type: 'object',
      properties: {
        totalCount: {
          type: 'number',
          description: 'Общее количество типов настроения',
        },
        categoryCounts: {
          type: 'object',
          description: 'Количество типов по категориям',
        },
        averageScore: {
          type: 'number',
          description: 'Средний балл настроения',
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
  async getMoodTypesStats() {
    return this.moodTypesAdminService.getMoodTypesStats();
  }
}
