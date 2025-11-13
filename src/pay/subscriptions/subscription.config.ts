import { PaginateConfig } from 'nestjs-paginate';
import { Subscription } from './entities/subscription.entity';

export const subscriptionsPaginationConfig: PaginateConfig<Subscription> = {
  sortableColumns: ['createdAt', 'periodEnd', 'status'],
  defaultSortBy: [['createdAt', 'DESC']],
  searchableColumns: ['userEmail', 'productId', 'status'],
  filterableColumns: {
    planInterval: true,
    status: true,
    productId: true,
    userId: true,
    userEmail: true,
    appUserId: true,
    createdAt: true,
  },
  maxLimit: 50,
  defaultLimit: 20,
};
