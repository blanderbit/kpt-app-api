import { PaginateConfig } from 'nestjs-paginate';
import { User } from '../../users/entities/user.entity';
import { FilterOperator, FilterSuffix } from 'nestjs-paginate';

export const CLIENT_PAGINATION_CONFIG: PaginateConfig<User> = {
  sortableColumns: [
    'id',
    'email',
    'firstName',
    'emailVerified',
    'createdAt',
    'updatedAt',
    'theme',
  ],
  defaultSortBy: [['createdAt', 'DESC']],
  searchableColumns: [
    'email',
    'firstName',
    'googleId',
    'firebaseUid',
    'appleId',
  ],
  filterableColumns: {
    id: [FilterOperator.EQ, FilterOperator.GT, FilterOperator.LT, FilterOperator.GTE, FilterOperator.LTE],
    email: [FilterOperator.EQ, FilterOperator.ILIKE, FilterOperator.SW, FilterOperator.CONTAINS],
    firstName: [FilterOperator.EQ, FilterOperator.ILIKE, FilterOperator.SW, FilterOperator.CONTAINS],
    lastName: [FilterOperator.EQ, FilterOperator.ILIKE, FilterOperator.SW, FilterOperator.CONTAINS],
    emailVerified: [FilterOperator.EQ],
    theme: [FilterOperator.EQ, FilterOperator.IN],
    roles: [FilterOperator.CONTAINS, FilterOperator.EQ],
    createdAt: [FilterOperator.BTW, FilterOperator.GTE, FilterOperator.LTE, FilterOperator.GT, FilterOperator.LT],
    updatedAt: [FilterOperator.BTW, FilterOperator.GTE, FilterOperator.LTE, FilterOperator.GT, FilterOperator.LT],
    googleId: [FilterOperator.EQ, FilterOperator.NULL, FilterSuffix.NOT],
    firebaseUid: [FilterOperator.EQ, FilterOperator.NULL, FilterSuffix.NOT],
    appleId: [FilterOperator.EQ, FilterOperator.NULL, FilterSuffix.NOT],
  },
  select: [
    'id',
    'email',
    'firstName',
    'avatarUrl',
    'emailVerified',
    'theme',
    'roles',
    'createdAt',
    'updatedAt',
    'googleId',
    'firebaseUid',
    'appleId',
  ],
  defaultLimit: 20,
  maxLimit: 100,
  relations: [],
};


