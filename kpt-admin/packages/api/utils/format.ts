export const formatFileSize = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const size = bytes / Math.pow(k, i)
  return `${Number.isFinite(size) ? size.toFixed(size >= 10 || i === 0 ? 0 : 2) : 0} ${sizes[i] ?? 'Bytes'}`
}

