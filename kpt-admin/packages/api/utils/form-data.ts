export const objectToFormData = (data: Record<string, unknown>, files?: File[], filesField: string = 'files') => {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value as Blob | string)
    }
  })

  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append(filesField, file)
    })
  }

  return formData
}

