import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { detectConceptFromMessage } from '@/lib/concept-detection'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser()
    if (auth.error) return auth.error

    const rateLimit = await checkRateLimit(auth.supabase, auth.user.id, 'detect-concept')
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          subject: '',
          concept: '',
          error: `Rate limit reached (${rateLimit.limit}/hour). Try again in about ${rateLimit.retryAfterMinutes} minutes.`,
        },
        { status: 429 },
      )
    }

    const body = await request.json()
    const userMessage = typeof body?.userMessage === 'string' ? body.userMessage : ''

    if (!userMessage.trim()) {
      return NextResponse.json({ subject: '', concept: '' }, { status: 200 })
    }

    const detected = await detectConceptFromMessage(userMessage)

    return NextResponse.json(detected)
  } catch (error) {
    console.error('Detect concept route error', error)
    return NextResponse.json({ subject: '', concept: '' }, { status: 200 })
  }
}
