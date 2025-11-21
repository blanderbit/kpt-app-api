import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Paginate, PaginateQuery, Paginated, ApiPaginationQuery } from 'nestjs-paginate';
import { SubscriptionsService, SubscriptionStats, SubscriptionStatsFilters } from './subscriptions.service';
import { Subscription } from './entities/subscription.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { subscriptionsPaginationConfig } from './subscription.config';
import { SubscriptionStatsQueryDto } from './dto/subscription-stats-query.dto';
import { SubscriptionPlanInterval } from './enums/subscription-plan-interval.enum';
import { SubscriptionStatus } from './enums/subscription-status.enum';
import { SubscriptionProvider } from './enums/subscription-provider.enum';

@ApiTags('admin/subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/subscriptions')
export class SubscriptionsAdminController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get subscriptions with filters and pagination' })
  @ApiPaginationQuery(subscriptionsPaginationConfig)
  @ApiOkResponse({ description: 'Paginated subscriptions list', type: Subscription, isArray: false })
  async findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Subscription>> {
    return this.subscriptionsService.getSubscriptionsWithFilter(query);
  }

  @Get('user')
  @ApiOperation({ summary: 'Get subscriptions for a specific user' })
  @ApiQuery({ name: 'userId', type: Number, required: true })
  @ApiPaginationQuery(subscriptionsPaginationConfig)
  @ApiOkResponse({ description: 'Paginated subscriptions list for user', type: Subscription, isArray: false })
  async findByUser(
    @Query('userId') userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Subscription>> {
    return this.subscriptionsService.getSubscriptionsForUser(userId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated subscription statistics' })
  @ApiQuery({ name: 'planInterval', required: false, enum: SubscriptionPlanInterval })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionStatus })
  @ApiQuery({ name: 'provider', required: false, enum: SubscriptionProvider })
  @ApiQuery({ name: 'linked', required: false, enum: ['linked', 'anonymous'] })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'ISO date string (inclusive)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'ISO date string (inclusive)' })
  @ApiOkResponse({ description: 'Aggregated subscription statistics' })
  async getStats(@Query() query: SubscriptionStatsQueryDto): Promise<SubscriptionStats> {
    const filters = this.buildStatsFilters(query);
    return this.subscriptionsService.getSubscriptionsStats(filters);
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: 'Get aggregated subscription statistics for a user' })
  @ApiQuery({ name: 'planInterval', required: false, enum: SubscriptionPlanInterval })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionStatus })
  @ApiQuery({ name: 'linked', required: false, enum: ['linked', 'anonymous'] })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Year to filter statistics (if not provided, returns all-time stats)' })
  @ApiOkResponse({ description: 'Aggregated subscription statistics for specified user' })
  async getUserStats(
    @Param('userId') userId: number,
    @Query() query: SubscriptionStatsQueryDto,
  ): Promise<SubscriptionStats> {
    const filters = this.buildStatsFilters(query, userId);
    return this.subscriptionsService.getUserSubscriptionStats(userId, filters);
  }

  @Get('user/:userId/latest')
  @ApiOperation({ summary: 'Get latest subscription record for a user' })
  @ApiOkResponse({ description: 'Latest subscription record for user', type: Subscription })
  async getUserLatest(@Param('userId') userId: number) {
    return this.subscriptionsService.getLatestSubscription(userId);
  }

  private buildStatsFilters(query: SubscriptionStatsQueryDto, userId?: number): SubscriptionStatsFilters {
    const filters: SubscriptionStatsFilters = {};

    if (query.planInterval) {
      filters.planInterval = query.planInterval;
    }

    if (query.status) {
      filters.status = query.status;
    }

    if (query.provider) {
      filters.provider = query.provider;
    }

    if (query.linked === 'linked') {
      filters.isLinked = true;
    } else if (query.linked === 'anonymous') {
      filters.isLinked = false;
    }

    if (query.year !== undefined && query.year !== null) {
      const year = typeof query.year === 'string' ? parseInt(query.year, 10) : query.year;
      if (!isNaN(year) && year > 0) {
        filters.year = year;
      }
    }

    if (userId !== undefined) {
      filters.userId = Number(userId);
    }

    return filters;
  }
}
