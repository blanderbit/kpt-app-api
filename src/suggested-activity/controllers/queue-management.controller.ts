import { Controller, Get, Post, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SuggestedActivityQueueService } from '../queue/suggested-activity-queue.service';
import { 
  QueueStatsDto, 
  QueueStatusDto, 
  QueueActionResponseDto, 
  QueueClearResponseDto 
} from '../dto/queue.dto';

@ApiTags('Queue Management')
@Controller('admin/queue')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QueueManagementController {
  constructor(
    private readonly suggestedActivityQueueService: SuggestedActivityQueueService,
  ) {}

  /**
   * Get queue statistics
   */
  @Get('stats')
  @Roles('admin')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics successfully retrieved',
    type: QueueStatsDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getQueueStats() {
    return await this.suggestedActivityQueueService.getQueueStats();
  }

  /**
   * Clear queue (remove all jobs)
   */
  @Delete('clear')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear queue' })
  @ApiResponse({
    status: 204,
    description: 'Queue successfully cleared',
    type: QueueClearResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async clearQueue() {
    await this.suggestedActivityQueueService.clearQueue();
    return { message: 'Queue successfully cleared' };
  }

  /**
   * Pause queue
   */
  @Post('pause')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause queue' })
  @ApiResponse({
    status: 200,
    description: 'Queue successfully paused',
    type: QueueActionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async pauseQueue() {
    await this.suggestedActivityQueueService.pauseQueue();
    return {
      message: 'Queue paused',
      status: 'paused',
    };
  }

  /**
   * Resume queue
   */
  @Post('resume')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume queue' })
  @ApiResponse({
    status: 200,
    description: 'Queue successfully resumed',
    type: QueueActionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async resumeQueue() {
    await this.suggestedActivityQueueService.resumeQueue();
    return {
      message: 'Queue resumed',
      status: 'resumed',
    };
  }

  /**
   * Get queue status
   */
  @Get('status')
  @Roles('admin')
  @ApiOperation({ summary: 'Get queue status' })
  @ApiResponse({
    status: 200,
    description: 'Queue status successfully retrieved',
    type: QueueStatusDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getQueueStatus() {
    try {
      // Проверяем статус очереди
      const stats = await this.suggestedActivityQueueService.getQueueStats();
      
      // Определяем статус на основе активных задач
      const status = stats.active > 0 ? 'active' : 'idle';
      
      return {
        status,
        timestamp: new Date().toISOString(),
        stats,
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
