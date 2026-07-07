import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function sanitizeFileName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '') || 'upload'
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'image file is required' }, { status: 400 })
    }

    if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, and WebP images are allowed' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Image must be 5MB or smaller' }, { status: 400 })
    }

    const supabase = createClient()
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${sanitizeFileName(file.name)}.${extension}`

    const { data, error } = await supabase.storage
      .from('chat-images')
      .upload(uniqueName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      throw error
    }

    const { data: publicUrlData } = supabase.storage.from('chat-images').getPublicUrl(data.path)

    return NextResponse.json({ imageUrl: publicUrlData.publicUrl })
  } catch (error) {
    console.error('Upload image error', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
