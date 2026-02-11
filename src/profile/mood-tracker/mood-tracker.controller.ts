import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MoodTrackerService } from './mood-tracker.service';
import { MoodTypesService, MoodTypeDto } from '../../core/mood-types';
import { CreateMoodTrackerDto, UpdateMoodTrackerDto, MoodTrackerResponseDto } from './dto/mood-tracker.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';

@ApiTags('mood-tracker')
@Controller('profile/mood-tracker')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MoodTrackerController {
  constructor(
    private readonly moodTrackerService: MoodTrackerService,
    private readonly moodTypesService: MoodTypesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Указать настроение за день',
    description: 'Устанавливает настроение за текущий день (только 1 раз в день)',
  })
  @ApiResponse({
    status: 201,
    description: 'Настроение установлено',
    type: MoodTrackerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
  })
  @ApiResponse({
    status: 409,
    description: 'Настроение за сегодня уже указано',
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  async setMoodForDay(
    @CurrentUser() user: User,
    @Body() createMoodTrackerDto: CreateMoodTrackerDto,
  ): Promise<MoodTrackerResponseDto> {
    return this.moodTrackerService.setMoodForDay(user.id, createMoodTrackerDto);
  }

  @Get('current')
  @ApiOperation({
    summary: 'Получить текущее настроение',
    description: 'Возвращает настроение за сегодняшний день',
  })
  @ApiResponse({
    status: 200,
    description: 'Текущее настроение',
    type: MoodTrackerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Настроение за сегодня не найдено',
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  async getCurrentMood(
    @CurrentUser('id') userId: number,
  ): Promise<MoodTrackerResponseDto | null> {
    return this.moodTrackerService.getCurrentMood(userId);
  }

  @Get('last-7-days')
  @ApiOperation({
    summary: 'Получить настроение за последние 7 дней',
    description: 'Возвращает настроение за последние 7 дней. Параметр lang задаёт язык для полей moodTypeDetails (name, description, categoryLabel) — ключи mood_types.* из файла типов настроения разрешаются через переводы админки.',
  })
  @ApiQuery({
    name: 'lang',
    description: 'Код языка для локализации moodTypeDetails (например en, ru, uk)',
    required: false,
    example: 'ru',
  })
  @ApiResponse({
    status: 200,
    description: 'Настроение за последние 7 дней',
    type: [MoodTrackerResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  async getMoodForLast7Days(
    @CurrentUser() user: User,
    @Query('lang') lang?: string,
  ): Promise<MoodTrackerResponseDto[]> {
    return this.moodTrackerService.getMoodForLast7Days(user.id, lang);
  }

  @Get('date/:date')
  @ApiOperation({
    summary: 'Получить настроение за конкретную дату',
    description: 'Возвращает настроение за указанную дату',
  })
  @ApiParam({
    name: 'date',
    description: 'Дата в формате YYYY-MM-DD',
    type: String,
    example: '2024-01-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Настроение за указанную дату',
    type: MoodTrackerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Настроение за указанную дату не найдено',
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  async getMoodForDate(
    @CurrentUser('id') userId: number,
    @Param('date') dateStr: string,
  ): Promise<MoodTrackerResponseDto | null> {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Неверный формат даты. Используйте YYYY-MM-DD');
    }
    return this.moodTrackerService.getMoodForDate(userId, date);
  }

  @Get('period')
  @ApiOperation({
    summary: 'Получить настроение за период',
    description: 'Возвращает настроение за указанный период',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Начальная дата в формате YYYY-MM-DD',
    required: true,
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Конечная дата в формате YYYY-MM-DD',
    required: true,
    type: String,
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Настроение за период',
    type: [MoodTrackerResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные параметры дат',
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  async getMoodForPeriod(
    @CurrentUser('id') userId: number,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ): Promise<MoodTrackerResponseDto[]> {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Неверный формат даты. Используйте YYYY-MM-DD');
    }
    
    if (startDate > endDate) {
      throw new Error('Начальная дата не может быть позже конечной');
    }
    
    return this.moodTrackerService.getMoodForPeriod(userId, startDate, endDate);
  }

  @Get('stats/period')
  @ApiOperation({
    summary: 'Получить статистику настроения за период',
    description: 'Возвращает статистику настроения за указанный период',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Начальная дата в формате YYYY-MM-DD',
    required: true,
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Конечная дата в формате YYYY-MM-DD',
    required: true,
    type: String,
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика настроения за период',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные параметры дат',
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  async getMoodStatsForPeriod(
    @CurrentUser('id') userId: number,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Неверный формат даты. Используйте YYYY-MM-DD');
    }
    
    if (startDate > endDate) {
      throw new Error('Начальная дата не может быть позже конечной');
    }
    
    return this.moodTrackerService.getMoodStatsForPeriod(userId, startDate, endDate);
  }

  @Put('date/:date')
  @ApiOperation({
    summary: 'Обновить настроение за конкретную дату',
    description: 'Обновляет настроение за указанную дату',
  })
  @ApiParam({
    name: 'date',
    description: 'Дата в формате YYYY-MM-DD',
    type: String,
    example: '2024-01-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Настроение обновлено',
    type: MoodTrackerResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Настроение за указанную дату не найдено',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные данные',
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  async updateMoodForDate(
    @CurrentUser('id') userId: number,
    @Param('date') dateStr: string,
    @Body() updateMoodTrackerDto: UpdateMoodTrackerDto,
  ): Promise<MoodTrackerResponseDto> {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Неверный формат даты. Используйте YYYY-MM-DD');
    }
    return this.moodTrackerService.updateMoodForDay(userId, date, updateMoodTrackerDto);
  }

  @Delete('date/:date')
  @ApiOperation({
    summary: 'Удалить настроение за конкретную дату',
    description: 'Удаляет настроение за указанную дату',
  })
  @ApiParam({
    name: 'date',
    description: 'Дата в формате YYYY-MM-DD',
    type: String,
    example: '2024-01-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Настроение удалено',
  })
  @ApiResponse({
    status: 404,
    description: 'Настроение за указанную дату не найдено',
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  async deleteMoodForDate(
    @CurrentUser('id') userId: number,
    @Param('date') dateStr: string,
  ): Promise<void> {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Неверный формат даты. Используйте YYYY-MM-DD');
    }
    return this.moodTrackerService.deleteMoodForDate(userId, date);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Получить все записи настроения',
    description: 'Возвращает все записи настроения, отсортированные по дате',
  })
  @ApiResponse({
    status: 200,
    description: 'Все записи настроения',
    type: [MoodTrackerResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  async getAllMoodTrackers(
    @CurrentUser('id') userId: number,
  ): Promise<MoodTrackerResponseDto[]> {
    return this.moodTrackerService.getAllMoodTrackers(userId);
  }

  @Get('mood-types')
  @ApiOperation({
    summary: 'Получить все типы настроения',
    description: 'Возвращает все доступные типы настроения с их характеристиками',
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
  async getAllMoodTypes(): Promise<MoodTypeDto[]> {
    return this.moodTypesService.getAllMoodTypes();
  }
}
