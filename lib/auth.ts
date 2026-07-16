import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export async function requireUser(): Promise<
  { user: User; supabase: Awaited<ReturnType<typeof createClient>>; error?: never } | {
    user?: never
    supabase?: never
    error: NextResponse
  }
> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return { user, supabase }
}

export function getUserInitials(nameOrEmail: string) {
  const cleaned = nameOrEmail.trim()
  if (!cleaned) return 'SA'

  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return cleaned.slice(0, 2).toUpperCase()
}

export function getDisplayName(user: User) {
  const metaName =
    typeof user.user_metadata?.display_name === 'string'
      ? user.user_metadata.display_name.trim()
      : ''
  if (metaName) return metaName
  if (user.email) return user.email.split('@')[0]
  return 'Learner'
}
