import {
  Controller,
  Get,
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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('profile/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('completed-tasks-days')
  @ApiOperation({
    summary: 'Количество дней с выполненными задачами',
    description: 'Возвращает количество дней, когда были выполнены задачи (помечены как closed)',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Начальная дата в формате YYYY-MM-DD',
    required: false,
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Конечная дата в формате YYYY-MM-DD',
    required: false,
    type: String,
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Количество дней с выполненными задачами',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные параметры дат',
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  async getCompletedTasksDays(
    @CurrentUser('id') userId: number,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        throw new Error('Неверный формат начальной даты. Используйте YYYY-MM-DD');
      }
    }

    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        throw new Error('Неверный формат конечной даты. Используйте YYYY-MM-DD');
      }
    }

    if (startDate && endDate && startDate > endDate) {
      throw new Error('Начальная дата не может быть позже конечной');
    }

    return this.analyticsService.getCompletedTasksDays(userId, startDate, endDate);
  }

  @Get('completed-tasks-count')
  @ApiOperation({
    summary: 'Количество выполненных задач',
    description: 'Возвращает общее количество выполненных задач (помечены как closed)',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Начальная дата в формате YYYY-MM-DD',
    required: false,
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Конечная дата в формате YYYY-MM-DD',
    required: false,
    type: String,
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Количество выполненных задач',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные параметры дат',
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  async getCompletedTasksCount(
    @CurrentUser('id') userId: number,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        throw new Error('Неверный формат начальной даты. Используйте YYYY-MM-DD');
      }
    }

    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        throw new Error('Неверный формат конечной даты. Используйте YYYY-MM-DD');
      }
    }

    if (startDate && endDate && startDate > endDate) {
      throw new Error('Начальная дата не может быть позже конечной');
    }

    return this.analyticsService.getCompletedTasksCount(userId, startDate, endDate);
  }

  @Get('rate-activity-averages')
  @ApiOperation({
    summary: 'Средние показатели RateActivity',
    description: 'Возвращает средние значения satisfactionLevel и hardnessLevel за все время',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Начальная дата в формате YYYY-MM-DD',
    required: false,
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Конечная дата в формате YYYY-MM-DD',
    required: false,
    type: String,
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Средние показатели RateActivity',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные параметры дат',
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  async getRateActivityAverages(
    @CurrentUser('id') userId: number,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        throw new Error('Неверный формат начальной даты. Используйте YYYY-MM-DD');
      }
    }

    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        throw new Error('Неверный формат конечной даты. Используйте YYYY-MM-DD');
      }
    }

    if (startDate && endDate && startDate > endDate) {
      throw new Error('Начальная дата не может быть позже конечной');
    }

    return this.analyticsService.getRateActivityAverages(userId, startDate, endDate);
  }

  @Get('overview')
  @ApiOperation({
    summary: 'Общий обзор аналитики',
    description: 'Возвращает общую сводку по всем метрикам',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Начальная дата в формате YYYY-MM-DD',
    required: false,
    type: String,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Конечная дата в формате YYYY-MM-DD',
    required: false,
    type: String,
    example: '2024-01-31',
  })
  @ApiResponse({
    status: 200,
    description: 'Общий обзор аналитики',
  })
  @ApiResponse({
    status: 400,
    description: 'Неверные параметры дат',
  })
  @ApiResponse({
    status: 401,
    description: 'Неавторизованный доступ',
  })
  async getAnalyticsOverview(
    @CurrentUser('id') userId: number,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr) {
      startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        throw new Error('Неверный формат начальной даты. Используйте YYYY-MM-DD');
      }
    }

    if (endDateStr) {
      endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        throw new Error('Неверный формат конечной даты. Используйте YYYY-MM-DD');
      }
    }

    if (startDate && endDate && startDate > endDate) {
      throw new Error('Начальная дата не может быть позже конечной');
    }

    return this.analyticsService.getAnalyticsOverview(userId, startDate, endDate);
  }
}
