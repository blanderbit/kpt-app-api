import { PaginateConfig } from 'nestjs-paginate';
import { FilterOperator } from 'nestjs-paginate';
import { Survey } from './entities/survey.entity';

/**
 * Pagination configuration for Survey module
 * Defines available filters, sortable fields, and search options
 */
export const surveyConfig: PaginateConfig<Survey> = {
  // Default pagination settings
  defaultLimit: 20,
  maxLimit: 100,
  
  // Available sortable fields
  sortableColumns: [
    'id',
    'title',
    'createdAt',
    'updatedAt'
  ],
  
  // Default sorting
  defaultSortBy: [['createdAt', 'DESC']],
  
  // Available filterable fields
  filterableColumns: {
    id: [FilterOperator.EQ, FilterOperator.GT, FilterOperator.GTE, FilterOperator.LT, FilterOperator.LTE],
    title: [FilterOperator.EQ, FilterOperator.CONTAINS, FilterOperator.ILIKE],
    status: [FilterOperator.EQ],
    language: [FilterOperator.EQ, FilterOperator.IN],
    createdAt: [FilterOperator.EQ, FilterOperator.GT, FilterOperator.GTE, FilterOperator.LT, FilterOperator.LTE],
    updatedAt: [FilterOperator.EQ, FilterOperator.GT, FilterOperator.GTE, FilterOperator.LT, FilterOperator.LTE],
  },
  
  // Searchable fields
  searchableColumns: [
    'title',
    'description',
  ],
  

  // Relations to include
  relations: ['files'],
  
  // Where conditions (global filters)
};

