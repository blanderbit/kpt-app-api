import dayjs from 'dayjs'

export const formatDateSafe = (
  value: string | null | undefined,
  format: string = 'DD.MM.YYYY HH:mm',
): string | null => {
  if (!value) return null
  const parsed = dayjs(value)
  if (!parsed.isValid()) {
    return value
  }
  return parsed.format(format)
}

export const formatDateTime = (
  value: string | null | undefined,
  format: string = 'DD.MM.YYYY HH:mm',
  fallback: string = 'Never',
): string => {
  const formatted = formatDateSafe(value, format)
  return formatted ?? fallback
}

