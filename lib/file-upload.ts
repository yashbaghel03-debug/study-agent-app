import { createClient } from './supabase'

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function sanitizeFileName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '') || 'upload'
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

export async function uploadFilesToStorage(files: File[]) {
  const supabase = createClient()
  const uploadedUrls: string[] = []

  for (const file of files) {
    const validationError = getFileValidationError(file)
    if (validationError) {
      throw new Error(validationError)
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${sanitizeFileName(file.name)}.${extension}`

    const { data, error } = await supabase.storage.from('chat-images').upload(uniqueName, file, {
      contentType: file.type,
      upsert: false,
    })

    if (error) {
      throw error
    }

    const { data: publicUrlData } = supabase.storage.from('chat-images').getPublicUrl(data.path)
    uploadedUrls.push(publicUrlData.publicUrl)
  }

  return uploadedUrls
}
