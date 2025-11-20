import { PaginateConfig } from 'nestjs-paginate';
import { FilterOperator } from 'nestjs-paginate';
import { Article } from './entities/article.entity';

/**
 * Pagination configuration for Article module
 * Defines available filters, sortable fields, and search options
 */
export const articleConfig: PaginateConfig<Article> = {
  // Default pagination settings
  defaultLimit: 20,
  maxLimit: 100,
  
  // Available sortable fields
  sortableColumns: [
    'id',
    'title',
    'updatedAt'
  ],
  
  // Default sorting
  defaultSortBy: [['updatedAt', 'DESC']],
  
  // Available filterable fields
  filterableColumns: {
    id: [FilterOperator.EQ, FilterOperator.GT, FilterOperator.GTE, FilterOperator.LT, FilterOperator.LTE],
    title: [FilterOperator.EQ, FilterOperator.CONTAINS, FilterOperator.ILIKE],
    status: [FilterOperator.EQ],
    language: [FilterOperator.EQ, FilterOperator.IN],
    updatedAt: [FilterOperator.EQ, FilterOperator.GT, FilterOperator.GTE, FilterOperator.LT, FilterOperator.LTE],
  },
  
  // Searchable fields
  searchableColumns: [
    'title',
    'text',
  ],
  
  // Relations to include
  // Note: select is removed to allow relations to load properly
  relations: ['files'],
};

