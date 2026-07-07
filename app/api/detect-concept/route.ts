import { createXai } from '@ai-sdk/xai'
import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userMessage = typeof body?.userMessage === 'string' ? body.userMessage : ''

    if (!userMessage.trim()) {
      return NextResponse.json({ subject: '', concept: '' }, { status: 200 })
    }

    const xai = createXai({ apiKey: process.env.XAI_API_KEY })

    const { text } = await generateText({
      model: xai('grok-4-fast'),
      prompt: [
        'Extract the study subject and concept from the following message.',
        'Return ONLY valid JSON with this exact shape: {"subject":"...","concept":"..."}.',
        'If the message is not about studying a concept, return {"subject":"","concept":""}.',
        'Do not include any surrounding text or markdown.',
        '',
        `Message: ${userMessage}`,
      ].join('\n'),
    })

    let parsed: { subject?: unknown; concept?: unknown }
    try {
      parsed = JSON.parse(text)
    } catch {
      return NextResponse.json({ subject: '', concept: '' }, { status: 200 })
    }

    return NextResponse.json({
      subject: typeof parsed.subject === 'string' ? parsed.subject : '',
      concept: typeof parsed.concept === 'string' ? parsed.concept : '',
    })
  } catch (error) {
    console.error('Detect concept route error', error)
    return NextResponse.json({ subject: '', concept: '' }, { status: 500 })
  }
}
