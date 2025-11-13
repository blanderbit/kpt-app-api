import { ref, type Ref } from 'vue'

export interface PaginationWorkerMeta {
  totalItems?: number
  totalPages?: number
  currentPage?: number
}

export interface PaginationWorkerLinks {
  next?: string | null
}

export interface PaginationWorkerResponse<T> {
  data: T[]
  total?: number
  last_page?: number
  next_page_url?: string | null
  meta?: PaginationWorkerMeta
  links?: PaginationWorkerLinks
}

export interface PaginationWorkerOptions<T, R extends PaginationWorkerResponse<T> = PaginationWorkerResponse<T>> {
  paginationDataRequest: (page: number) => Promise<R>
  dataTransformation?: (item: T) => T | null | undefined
  beforeConcat?: (current: T[], incoming: T[]) => T[]
  notToConcatElements?: boolean
}

export interface PaginationLoadParams {
  pageNumber: number
  $state?: {
    loaded?: () => void
    complete?: () => void
    error?: () => void
  }
  forceUpdate?: boolean
}

export interface PaginationWorkerResult<T> {
  paginationElements: Ref<T[]>
  paginationPage: Ref<number>
  paginationTotalCount: Ref<number>
  paginationIsNextPage: Ref<boolean>
  paginationClearData: () => void
  paginationLoad: (params: PaginationLoadParams) => Promise<void>
  paginationLastPage: Ref<number>
}

const pickNumber = (...values: Array<number | null | undefined>): number | undefined => {
  for (const value of values) {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value
    }
  }
  return undefined
}

export const PaginationWorker = <T, R extends PaginationWorkerResponse<T> = PaginationWorkerResponse<T>>(
  options: PaginationWorkerOptions<T, R>
): PaginationWorkerResult<T> => {
  const {
    paginationDataRequest,
    dataTransformation,
    beforeConcat,
    notToConcatElements,
  } = options

  const paginationElements = ref<T[]>([]) as Ref<T[]>
  const paginationPage = ref(0)
  const paginationTotalCount = ref(0)
  const paginationLastPage = ref(0)
  const paginationIsNextPage = ref(true)
  const functionsResults = ref<Promise<unknown>[]>([])

  const paginationClearData = () => {
    paginationElements.value = []
    paginationPage.value = 0
    paginationTotalCount.value = 0
    paginationLastPage.value = 0
    paginationIsNextPage.value = true
  }

  const paginationLoad = async ({ pageNumber, $state, forceUpdate }: PaginationLoadParams): Promise<void> => {
    const normalizedPage = pageNumber < 1 ? 1 : pageNumber

    if (normalizedPage === paginationPage.value && !forceUpdate) {
      return
    }

    if (!paginationIsNextPage.value && !forceUpdate) {
      if ($state?.complete) {
        $state.complete()
      }
      return
    }

    paginationPage.value = normalizedPage

    if (functionsResults.value.length) {
      await Promise.allSettled(functionsResults.value)
    }

    if (!paginationIsNextPage.value && $state?.complete) {
      $state.complete()
      return
    }

    functionsResults.value = []

    const request = paginationDataRequest(normalizedPage)
      .then((result) => {
        const rawItems = result?.data ?? []
        const transformedItems = dataTransformation
          ? (rawItems.map(dataTransformation).filter((item): item is T => Boolean(item)))
          : rawItems

        if (notToConcatElements) {
          paginationElements.value = transformedItems
        } else {
          const nextItems = beforeConcat
            ? beforeConcat(paginationElements.value, transformedItems)
            : paginationElements.value.concat(transformedItems)
          paginationElements.value = nextItems
        }

        const calculatedTotal = pickNumber(
          result.total,
          result.meta?.totalItems
        )

        if (typeof calculatedTotal === 'number') {
          paginationTotalCount.value = calculatedTotal
        } else if (notToConcatElements) {
          paginationTotalCount.value = transformedItems.length
        }

        const lastPage = pickNumber(result.last_page, result.meta?.totalPages)
        if (typeof lastPage === 'number') {
          paginationLastPage.value = lastPage
        }

        const hasNext = (() => {
          if (typeof result.next_page_url !== 'undefined') {
            return Boolean(result.next_page_url)
          }

          if (typeof result.links?.next !== 'undefined') {
            return Boolean(result.links?.next)
          }

          if (
            typeof result.meta?.currentPage === 'number' &&
            typeof result.meta?.totalPages === 'number'
          ) {
            return result.meta.currentPage < result.meta.totalPages
          }

          return false
        })()

        paginationIsNextPage.value = hasNext

        if (typeof result.meta?.currentPage === 'number') {
          paginationPage.value = result.meta.currentPage
        }

        if ($state?.loaded) {
          $state.loaded()
        }

        if (!paginationIsNextPage.value && $state?.complete) {
          $state.complete()
        }
      })
      .catch((error) => {
        console.error('[paginationDataRequest]', error)
        if ($state?.error) {
          $state.error()
        }
        throw error
      })

    functionsResults.value.push(request)

    await request
  }

  return {
    paginationElements,
    paginationPage,
    paginationTotalCount,
    paginationIsNextPage,
    paginationClearData,
    paginationLoad,
    paginationLastPage,
  }
}

export default PaginationWorker

