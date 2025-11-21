import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Paginate, PaginateQuery, Paginated, PaginatedSwaggerDocs } from 'nestjs-paginate';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { NotificationsService } from './notifications.service';
import { CustomNotificationDto } from './dto/custom-notification.dto';
import { UserDevice } from './entities/user-device.entity';

@ApiTags('admin/notifications')
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin')
export class NotificationsAdminController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('broadcast')
  @ApiOperation({
    summary: 'Broadcast custom push notification',
    description: 'Queues a custom Firebase notification to be delivered to all users with active device tokens via background workers',
  })
  @ApiResponse({
    status: 200,
    description: 'Broadcast summary with statistics',
  })
  async broadcast(@Body() dto: CustomNotificationDto) {
    return this.notificationsService.broadcastCustomNotification(dto);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get notification users statistics',
    description: 'Returns total users count, number of users with active device tokens and without them',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics fetched successfully',
  })
  async getStats() {
    return this.notificationsService.getUserDeviceStatistics();
  }

  @Get('devices')
  @ApiOperation({
    summary: 'List active device tokens',
    description: 'Returns paginated list of active device tokens',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Optional user identifier to filter active device tokens',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    type: Number,
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    type: Number,
    required: false,
    example: 10,
  })
  @PaginatedSwaggerDocs(UserDevice, {
    defaultLimit: 10,
    maxLimit: 100,
    sortableColumns: ['id', 'userId', 'updatedAt', 'lastUsedAt'],
    filterableColumns: {
      userId: true,
      platform: true,
      isActive: true,
    },
  })
  @ApiResponse({ status: 200, description: 'Active device tokens fetched successfully' })
  async getActiveDevices(
    @Paginate() query: PaginateQuery,
    @Query('userId') userId?: string,
  ): Promise<Paginated<UserDevice>> {
    const parsedUserId = typeof userId === 'string' ? Number.parseInt(userId, 10) : undefined;
    const filterUserId =
      parsedUserId !== undefined && !Number.isNaN(parsedUserId) ? parsedUserId : undefined;
    
    // Add userId to filter if provided
    if (filterUserId !== undefined) {
      query.filter = query.filter || {};
      query.filter.userId = `$eq:${filterUserId}`;
    }
    
    return this.notificationsService.getActiveDeviceTokensPaginated(query);
  }

  @Get('notifications')
  @ApiOperation({
    summary: 'List last sent notification timestamps',
    description: 'Returns tracker data indicating when each notification type was last sent for users',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    type: Number,
    description: 'Optional user identifier to filter notification tracker records',
  })
  @ApiResponse({ status: 200, description: 'Notification tracker fetched successfully' })
  async getNotificationTracker(@Query('userId') userId?: string) {
    const parsedUserId = typeof userId === 'string' ? Number.parseInt(userId, 10) : undefined;
    const filterUserId =
      parsedUserId !== undefined && !Number.isNaN(parsedUserId) ? parsedUserId : undefined;
    return this.notificationsService.getNotificationTracker(filterUserId);
  }
}


