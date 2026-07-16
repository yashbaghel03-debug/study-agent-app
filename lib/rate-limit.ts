import type { SupabaseClient } from '@supabase/supabase-js'

export type RateLimitRoute = 'chat' | 'detect-concept' | 'upload-image'

const DEFAULT_LIMITS: Record<RateLimitRoute, number> = {
  chat: 30,
  'detect-concept': 60,
  'upload-image': 10,
}

function getHourWindow() {
  const now = new Date()
  now.setMinutes(0, 0, 0)
  return now.toISOString()
}

function getLimit(route: RateLimitRoute) {
  const envKey =
    route === 'chat'
      ? 'RATE_LIMIT_CHAT_PER_HOUR'
      : route === 'detect-concept'
        ? 'RATE_LIMIT_DETECT_CONCEPT_PER_HOUR'
        : 'RATE_LIMIT_UPLOAD_IMAGE_PER_HOUR'

  const configured = Number(process.env[envKey])
  if (Number.isFinite(configured) && configured > 0) {
    return configured
  }

  return DEFAULT_LIMITS[route]
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  route: RateLimitRoute,
): Promise<
  | { allowed: true; remaining: number }
  | { allowed: false; limit: number; retryAfterMinutes: number }
> {
  const limit = getLimit(route)
  const hourWindow = getHourWindow()

  const { data, error } = await supabase
    .from('api_usage')
    .select('request_count')
    .eq('user_id', userId)
    .eq('route', route)
    .eq('hour_window', hourWindow)
    .maybeSingle()

  if (error) {
    throw error
  }

  const currentCount = data?.request_count ?? 0

  if (currentCount >= limit) {
    const retryAfterMinutes = Math.max(1, 60 - new Date().getMinutes())
    return { allowed: false, limit, retryAfterMinutes }
  }

  if (data) {
    const { error: updateError } = await supabase
      .from('api_usage')
      .update({ request_count: currentCount + 1 })
      .eq('user_id', userId)
      .eq('route', route)
      .eq('hour_window', hourWindow)

    if (updateError) {
      throw updateError
    }
  } else {
    const { error: insertError } = await supabase.from('api_usage').insert({
      user_id: userId,
      route,
      hour_window: hourWindow,
      request_count: 1,
    })

    if (insertError) {
      throw insertError
    }
  }

  return { allowed: true, remaining: limit - currentCount - 1 }
}
