import { createGroq } from '@ai-sdk/groq'
import { streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

function buildSystemPrompt(conceptRow: any, subject: string, concept: string) {
  const subjectContext = subject?.trim() ? `Subject: ${subject.trim()}` : 'Subject: general study'
  const conceptContext = concept?.trim() ? `Concept: ${concept.trim()}` : 'Concept: general discussion'

  if (!conceptRow) {
    return [
      'You are a patient, encouraging tutor.',
      'Mode A: beginner-friendly, analogy-first, and define all terms clearly.',
      'Start by explaining the idea in simple language, then build up from there.',
      'Be conversational and supportive, and avoid assuming prior knowledge.',
      `${subjectContext}`,
      `${conceptContext}`,
    ].join('\n')
  }

  const masteryLevel = conceptRow.mastery_level?.trim()

  if (masteryLevel === 'Introduced' || masteryLevel === 'Developing') {
    return [
      'You are a patient, encouraging tutor.',
      'Mode B: reference prior knowledge, mention weak areas, and keep a moderate pace.',
      'Explain the core idea clearly, connect it to things the learner likely already knows, and gently point out gaps to work on.',
      'Avoid overwhelming the learner with too much detail at once.',
      `${subjectContext}`,
      `${conceptContext}`,
      conceptRow.weak_areas?.length ? `Weak areas to watch: ${conceptRow.weak_areas.join(', ')}` : null,
      conceptRow.strong_areas?.length ? `Known strengths: ${conceptRow.strong_areas.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join('\n')
  }

  return [
    'You are a sharp, concise tutor.',
    'Mode C: technical, skip basics, and focus on nuance and practical understanding.',
    'Assume the learner already has a foundation and spend your energy on subtleties, edge cases, and deeper insight.',
    'Keep explanations efficient while still being helpful.',
    `${subjectContext}`,
    `${conceptContext}`,
    conceptRow.weak_areas?.length ? `Weak areas to watch: ${conceptRow.weak_areas.join(', ')}` : null,
    conceptRow.strong_areas?.length ? `Known strengths: ${conceptRow.strong_areas.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

function inferTitleFromMessage(message: string) {
  const words = message
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return 'New Chat'
  }

  const titleWords = words.slice(0, 6)
  return titleWords.length >= 3 ? titleWords.join(' ') : words.join(' ')
}

function getImageMediaType(url: string) {
  const lower = url.toLowerCase()

  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  return 'image/jpeg'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userMessage = typeof body?.userMessage === 'string' ? body.userMessage : ''
    const subject = typeof body?.subject === 'string' ? body.subject : ''
    const concept = typeof body?.concept === 'string' ? body.concept : ''
    const chatId = typeof body?.chatId === 'string' ? body.chatId : ''
    const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl : ''

    if (!userMessage.trim()) {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 })
    }

    if (!chatId.trim()) {
      return NextResponse.json({ error: 'chatId is required' }, { status: 400 })
    }

    const supabase = createClient()

    await supabase.from('chats').upsert({ id: chatId, title: null }, { onConflict: 'id' })

    const { error: userMessageError } = await supabase.from('messages').insert({
      chat_id: chatId,
      role: 'user',
      content: userMessage,
      image_url: imageUrl || null,
    })

    if (userMessageError) {
      throw userMessageError
    }

    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('chat_id', chatId)

    if (countError) {
      throw countError
    }

    if (count === 1) {
      const title = inferTitleFromMessage(userMessage)
      await supabase.from('chats').update({ title }).eq('id', chatId)
    }

    const subjectTrimmed = subject.trim()
    const conceptTrimmed = concept.trim()

    let conceptRow: any = null
    if (subjectTrimmed && conceptTrimmed) {
      const { data, error } = await supabase
        .from('concepts')
        .select('*')
        .eq('subject', subjectTrimmed)
        .eq('concept', conceptTrimmed)
        .maybeSingle()

      if (error) {
        throw error
      }

      conceptRow = data
    }

    const systemPrompt = buildSystemPrompt(conceptRow, subjectTrimmed, conceptTrimmed)

    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

    const messages: Array<{
      role: 'user'
      content: Array<{ type: 'text'; text: string } | { type: 'file'; mediaType: string; data: URL | string }>
    }> = []

    if (imageUrl) {
      try {
        const url = new URL(imageUrl)
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: userMessage },
            { type: 'file', mediaType: getImageMediaType(url.pathname), data: url },
          ],
        })
      } catch {
        messages.push({
          role: 'user',
          content: [{ type: 'text', text: userMessage }],
        })
      }
    } else {
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: userMessage }],
      })
    }

    const result = streamText({
      model: groq('openai/gpt-oss-120b'),
      system: systemPrompt,
      messages,
      onFinish: async ({ text }) => {
        await supabase.from('messages').insert({
          chat_id: chatId,
          role: 'assistant',
          content: text,
        })
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat route error', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 },
    )
  }
}
