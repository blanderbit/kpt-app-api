import { PaginateConfig } from 'nestjs-paginate';
import { Activity } from './entities/activity.entity';
import { FilterOperator, FilterSuffix } from 'nestjs-paginate';

export const ACTIVITY_PAGINATION_CONFIG: PaginateConfig<Activity> = {
  sortableColumns: [
    'id',
    'activityName',
    'activityType',
    'position',
    'status',
    'createdAt',
    'updatedAt',
    'closedAt',
  ],
  relations: ['rateActivities'],
  defaultSortBy: [['position', 'ASC']],
  searchableColumns: [
    'activityName',
    'activityType',
  ],
  filterableColumns: {
    id: [FilterOperator.EQ, FilterOperator.GT, FilterOperator.LT, FilterOperator.GTE, FilterOperator.LTE],
    activityName: [FilterOperator.EQ, FilterOperator.ILIKE, FilterOperator.SW, FilterOperator.CONTAINS],
    activityType: [FilterOperator.EQ, FilterOperator.IN, FilterOperator.ILIKE, FilterOperator.CONTAINS],
    status: [FilterOperator.EQ, FilterOperator.IN],
    userId: [FilterOperator.EQ],
    createdAt: [FilterOperator.BTW, FilterOperator.GTE, FilterOperator.LTE, FilterOperator.GT, FilterOperator.LT],
    updatedAt: [FilterOperator.BTW, FilterOperator.GTE, FilterOperator.LTE, FilterOperator.GT, FilterOperator.LT],
    closedAt: [FilterOperator.BTW, FilterOperator.GTE, FilterOperator.LTE, FilterOperator.GT, FilterOperator.LT, FilterOperator.NULL, FilterSuffix.NOT],
  },
  defaultLimit: 20,
  maxLimit: 100,
  nullSort: 'last',
};


