export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function sanitizeFileName(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^[-.]+|[-.]+$/g, '') || 'upload'
  )
}

export function getFileValidationError(file: File) {
  if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, and WebP images are allowed'
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Image must be 5MB or smaller'
  }

  return null
}
