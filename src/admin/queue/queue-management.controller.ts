import { Controller, Get, Post, Delete, UseGuards, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminQueueService } from './admin-queue.service';
import { 
  QueueActionResponseDto, 
  QueueClearResponseDto 
} from '../../suggested-activity/dto/queue.dto';
import {
  QueueListResponseDto,
  QueueStatsExtendedDto,
  ClearJobsResponseDto,
} from './dto/queue-admin.dto';

@ApiTags('Queue Management')
@Controller('admin/queue')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QueueManagementController {
  constructor(
    private readonly adminQueueService: AdminQueueService,
  ) {}

  /**
   * Get all queue names
   */
  @Get('names')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all queue names from Redis' })
  @ApiResponse({
    status: 200,
    description: 'Queue names successfully retrieved',
    schema: {
      type: 'object',
      properties: {
        names: { type: 'array', items: { type: 'string' } },
        total: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getQueueNames() {
    const names = await this.adminQueueService.getAllQueueNames();
    return {
      names,
      total: names.length,
    };
  }

  /**
   * Get list of all queues with statistics
   */
  @Get('list')
  @Roles('admin')
  @ApiOperation({ summary: 'Get list of all queues with statistics' })
  @ApiResponse({
    status: 200,
    description: 'List of queues successfully retrieved',
    type: QueueListResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getQueueList() {
    return await this.adminQueueService.getQueueList();
  }

  /**
   * Get queue statistics by name
   */
  @Get(':queueName/stats')
  @Roles('admin')
  @ApiParam({ name: 'queueName', description: 'Queue name', example: 'suggested-activity' })
  @ApiOperation({ summary: 'Get queue statistics for specific queue' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics successfully retrieved',
    type: QueueStatsExtendedDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Queue not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getQueueStats(@Param('queueName') queueName: string) {
    return await this.adminQueueService.getQueueStats(queueName);
  }

  /**
   * Clear queue (remove all jobs)
   */
  @Delete(':queueName/clear')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'queueName', description: 'Queue name', example: 'suggested-activity' })
  @ApiOperation({ summary: 'Clear all jobs from queue' })
  @ApiResponse({
    status: 200,
    description: 'Queue successfully cleared',
    type: QueueClearResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Queue not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async clearQueue(@Param('queueName') queueName: string) {
    await this.adminQueueService.clearQueue(queueName);
    return { message: `Queue "${queueName}" successfully cleared` };
  }

  /**
   * Clear only failed jobs from queue
   */
  @Delete(':queueName/clear-failed')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'queueName', description: 'Queue name', example: 'suggested-activity' })
  @ApiOperation({ summary: 'Clear only failed jobs from queue' })
  @ApiResponse({
    status: 200,
    description: 'Failed jobs successfully cleared',
    type: ClearJobsResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Queue not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async clearFailedJobs(@Param('queueName') queueName: string) {
    return await this.adminQueueService.clearFailedJobs(queueName);
  }

  /**
   * Clear only completed jobs from queue
   */
  @Delete(':queueName/clear-completed')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'queueName', description: 'Queue name', example: 'suggested-activity' })
  @ApiOperation({ summary: 'Clear only completed jobs from queue' })
  @ApiResponse({
    status: 200,
    description: 'Completed jobs successfully cleared',
    type: ClearJobsResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Queue not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async clearCompletedJobs(@Param('queueName') queueName: string) {
    return await this.adminQueueService.clearCompletedJobs(queueName);
  }

  /**
   * Pause queue
   */
  @Post(':queueName/pause')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'queueName', description: 'Queue name', example: 'suggested-activity' })
  @ApiOperation({ summary: 'Pause queue processing' })
  @ApiResponse({
    status: 200,
    description: 'Queue successfully paused',
    type: QueueActionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Queue not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async pauseQueue(@Param('queueName') queueName: string) {
    await this.adminQueueService.pauseQueue(queueName);
    return {
      message: `Queue "${queueName}" paused`,
      status: 'paused',
    };
  }

  /**
   * Resume queue
   */
  @Post(':queueName/resume')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'queueName', description: 'Queue name', example: 'suggested-activity' })
  @ApiOperation({ summary: 'Resume queue processing' })
  @ApiResponse({
    status: 200,
    description: 'Queue successfully resumed',
    type: QueueActionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Queue not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async resumeQueue(@Param('queueName') queueName: string) {
    await this.adminQueueService.resumeQueue(queueName);
    return {
      message: `Queue "${queueName}" resumed`,
      status: 'resumed',
    };
  }

}

