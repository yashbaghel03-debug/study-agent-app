import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const subject = typeof body?.subject === 'string' ? body.subject.trim() : ''
    const concept = typeof body?.concept === 'string' ? body.concept.trim() : ''
    const masteryLevel = typeof body?.masteryLevel === 'string' ? body.masteryLevel : null
    const overviewGist = typeof body?.overviewGist === 'string' ? body.overviewGist : null
    const deepDiveGist = Array.isArray(body?.deepDiveGist)
      ? body.deepDiveGist.filter((item: unknown): item is string => typeof item === 'string')
      : []
    const strongAreas = Array.isArray(body?.strongAreas)
      ? body.strongAreas.filter((item: unknown): item is string => typeof item === 'string')
      : []
    const weakAreas = Array.isArray(body?.weakAreas)
      ? body.weakAreas.filter((item: unknown): item is string => typeof item === 'string')
      : []
    const nextSteps = Array.isArray(body?.nextSteps)
      ? body.nextSteps.filter((item: unknown): item is string => typeof item === 'string')
      : []
    const notes = typeof body?.notes === 'string' ? body.notes : null

    if (!subject || !concept) {
      return NextResponse.json({ error: 'subject and concept are required' }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('concepts')
      .upsert(
        {
          subject,
          concept,
          mastery_level: masteryLevel,
          overview_gist: overviewGist,
          deep_dive_gist: deepDiveGist,
          strong_areas: strongAreas,
          weak_areas: weakAreas,
          next_steps: nextSteps,
          notes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'subject,concept' },
      )
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, concept: data })
  } catch (error) {
    console.error('Save concept route error', error)
    return NextResponse.json({ error: 'Failed to save concept' }, { status: 500 })
  }
}
