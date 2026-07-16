import { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'

export type DetectedConcept = {
  subject: string
  concept: string
}

export async function detectConceptFromMessage(userMessage: string): Promise<DetectedConcept> {
  const trimmed = userMessage.trim()
  if (!trimmed) {
    return { subject: '', concept: '' }
  }

  if (!process.env.GROQ_API_KEY) {
    return fallbackConceptFromMessage(trimmed)
  }

  try {
    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })

    const { text } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      prompt: [
        'Extract the study subject and concept from the following message.',
        'Return ONLY valid JSON with this exact shape: {"subject":"...","concept":"..."}.',
        'If the message is not about studying a concept, return {"subject":"","concept":""}.',
        'Do not include any surrounding text or markdown.',
        '',
        `Message: ${trimmed}`,
      ].join('\n'),
    })

    const parsed = JSON.parse(text) as { subject?: unknown; concept?: unknown }
    const subject = typeof parsed.subject === 'string' ? parsed.subject.trim() : ''
    const concept = typeof parsed.concept === 'string' ? parsed.concept.trim() : ''

    if (subject && concept) {
      return { subject, concept }
    }

    return fallbackConceptFromMessage(trimmed)
  } catch {
    return fallbackConceptFromMessage(trimmed)
  }
}

function fallbackConceptFromMessage(message: string): DetectedConcept {
  const words = message.split(/\s+/).filter(Boolean)
  const concept = words.slice(0, 5).join(' ')
  return {
    subject: 'General Study',
    concept: concept || 'Study notes',
  }
}
