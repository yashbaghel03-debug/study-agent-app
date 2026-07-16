import { createClient } from '@/lib/supabase/server'
import { sanitizeFileName, getFileValidationError, ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/file-validation'

export { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE_BYTES, sanitizeFileName, getFileValidationError }

export async function uploadFilesToStorage(files: File[], userId: string) {
  const supabase = await createClient()
  const uploadedUrls: string[] = []

  for (const file of files) {
    const validationError = getFileValidationError(file)
    if (validationError) {
      throw new Error(validationError)
    }

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const uniqueName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-${sanitizeFileName(file.name)}.${extension}`

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
