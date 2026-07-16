import type { SupabaseClient } from '@supabase/supabase-js'

export async function saveStudyMemory(
  supabase: SupabaseClient,
  userId: string,
  params: {
    subject: string
    concept: string
    userText: string
    imageUrls?: string[]
    masteryLevel?: string
  },
) {
  const trimmedText = params.userText.trim()
  const notesParts = [trimmedText]

  if (params.imageUrls?.length) {
    notesParts.push('', 'Attached images:', ...params.imageUrls.map((url, index) => `${index + 1}. ${url}`))
  }

  const { data, error } = await supabase
    .from('concepts')
    .upsert(
      {
        user_id: userId,
        subject: params.subject,
        concept: params.concept,
        mastery_level: params.masteryLevel ?? 'Introduced',
        overview_gist: trimmedText.slice(0, 280) || 'Saved from photo upload',
        notes: notesParts.filter(Boolean).join('\n'),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,subject,concept' },
    )
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}
