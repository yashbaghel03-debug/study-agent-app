import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { detectConceptFromMessage } from '@/lib/concept-detection'
import { saveStudyMemory } from '@/lib/save-memory'
import { uploadFilesToStorage } from '@/lib/file-upload'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser()
    if (auth.error) return auth.error

    const rateLimit = await checkRateLimit(auth.supabase, auth.user.id, 'upload-image')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Upload limit reached (${rateLimit.limit}/hour). Try again in about ${rateLimit.retryAfterMinutes} minutes.`,
        },
        { status: 429 },
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('images').filter((entry): entry is File => entry instanceof File)
    const message = typeof formData.get('message') === 'string' ? formData.get('message') as string : ''

    if (files.length === 0) {
      return NextResponse.json({ error: 'At least one image file is required' }, { status: 400 })
    }

    const uploadedImageUrls = await uploadFilesToStorage(files, auth.user.id)

    let memorySaved = false
    let savedSubject = ''
    let savedConcept = ''

    if (message.trim()) {
      const detected = await detectConceptFromMessage(message.trim())
      const subject = detected.subject || 'General Study'
      const concept = detected.concept || message.trim().split(/\s+/).slice(0, 5).join(' ')

      await saveStudyMemory(auth.supabase, auth.user.id, {
        subject,
        concept,
        userText: message.trim(),
        imageUrls: uploadedImageUrls,
        masteryLevel: 'Introduced',
      })

      memorySaved = true
      savedSubject = subject
      savedConcept = concept
    }

    return NextResponse.json({
      imageUrls: uploadedImageUrls,
      memorySaved,
      savedSubject,
      savedConcept,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload image'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
