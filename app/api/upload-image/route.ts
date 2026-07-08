import { NextRequest, NextResponse } from 'next/server'
import { uploadFilesToStorage } from '@/lib/file-upload'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('images').filter((entry): entry is File => entry instanceof File)

    if (files.length === 0) {
      return NextResponse.json({ error: 'At least one image file is required' }, { status: 400 })
    }

    const uploadedImageUrls = await uploadFilesToStorage(files)

    return NextResponse.json({ imageUrls: uploadedImageUrls })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload image'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
