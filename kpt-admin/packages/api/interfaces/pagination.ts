export type SortDirection = 'ASC' | 'DESC'
export type SortTuple = [string, SortDirection]

export interface PaginationMeta {
  itemsPerPage?: number
  totalItems?: number
  currentPage?: number
  totalPages?: number
  sortBy?: SortTuple[]
  filter?: Record<string, unknown>
}

export interface PaginationLinks {
  current?: string
  next?: string
  prev?: string
  first?: string
  last?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
  links?: PaginationLinks
}

