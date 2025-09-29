import { PaginateConfig } from 'nestjs-paginate';
import { User } from './entities/user.entity';
import { FilterOperator } from 'nestjs-paginate';

/**
 * Pagination configuration for Users module
 * Defines available filters, sortable fields, and search options
 */
export const usersConfig: PaginateConfig<User> = {
  // Default pagination settings
  defaultLimit: 20,
  maxLimit: 100,
  
  // Available sortable fields
  sortableColumns: [
    'id',
    'email',
    'firstName',
    'createdAt',
    'updatedAt'
  ],
  
  // Default sorting
  defaultSortBy: [['createdAt', 'DESC']],
  
  // Available filterable fields
  filterableColumns: {
    id: [FilterOperator.EQ, FilterOperator.GT, FilterOperator.GTE, FilterOperator.LT, FilterOperator.LTE],
    email: [FilterOperator.EQ, FilterOperator.CONTAINS, FilterOperator.ILIKE],
    firstName: [FilterOperator.EQ, FilterOperator.CONTAINS, FilterOperator.ILIKE],
    lastName: [FilterOperator.EQ, FilterOperator.CONTAINS, FilterOperator.ILIKE],
    isActive: [FilterOperator.EQ],
    isVerified: [FilterOperator.EQ],
    createdAt: [FilterOperator.EQ, FilterOperator.GT, FilterOperator.GTE, FilterOperator.LT, FilterOperator.LTE],
    updatedAt: [FilterOperator.EQ, FilterOperator.GT, FilterOperator.GTE, FilterOperator.LT, FilterOperator.LTE],
    lastLoginAt: [FilterOperator.EQ, FilterOperator.GT, FilterOperator.GTE, FilterOperator.LT, FilterOperator.LTE],
    roles: [FilterOperator.CONTAINS, FilterOperator.EQ]
  },
  
  // Searchable fields
  searchableColumns: [
    'email',
    'firstName',
  ],
  
  // Select only necessary fields for performance
  select: [
    'id',
    'email',
    'firstName',
    'lastName',
    'createdAt',
    'updatedAt',
    'lastLoginAt',
    'isActive',
    'isVerified',
    'roles'
  ],
  
  // Relations to include
  relations: [],
  
  // Where conditions (global filters)
  where: {
    // Only active users by default
    // isActive: true
  }
};
