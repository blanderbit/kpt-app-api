export const DEFAULT_PAGE_SIZE = 20
export const SMALL_PAGE_SIZE = DEFAULT_PAGE_SIZE / 2

export const normalizePageSize = (value: unknown, fallback: number = DEFAULT_PAGE_SIZE): number => {
  const parsed = Number(value ?? fallback)

  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed)
  }

  return fallback
}
