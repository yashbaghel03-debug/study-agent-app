import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

export async function GET() {
  try {
    const auth = await requireUser()
    if (auth.error) return auth.error

    const { user, supabase } = auth

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, theme, onboarding_completed, preferred_subject')
      .eq('id', user.id)
      .maybeSingle()

    const displayName =
      profile?.display_name ||
      (typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : null) ||
      (user.email ? user.email.split('@')[0] : 'Learner')

    return NextResponse.json({
      id: user.id,
      email: user.email ?? null,
      displayName,
      avatarUrl: profile?.avatar_url ?? null,
      theme: profile?.theme === 'light' ? 'light' : 'dark',
      plan: 'Free',
      status: user.email_confirmed_at ? 'Verified' : 'Pending verification',
      onboardingCompleted: profile?.onboarding_completed ?? false,
      preferredSubject: profile?.preferred_subject ?? null,
    })
  } catch (error) {
    console.error('Get profile error', error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireUser()
    if (auth.error) return auth.error

    const { user, supabase } = auth
    const body = await request.json()
    const displayName = typeof body?.displayName === 'string' ? body.displayName.trim() : ''
    const theme = body?.theme === 'light' || body?.theme === 'dark' ? body.theme : null
    const onboardingCompleted = typeof body?.onboardingCompleted === 'boolean' ? body.onboardingCompleted : null
    const preferredSubject =
      typeof body?.preferredSubject === 'string' ? body.preferredSubject.trim() : null

    if (!displayName && !theme && onboardingCompleted === null && !preferredSubject) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const profileUpdate: {
      display_name?: string
      theme?: string
      onboarding_completed?: boolean
      preferred_subject?: string
      updated_at: string
    } = {
      updated_at: new Date().toISOString(),
    }
    if (displayName) profileUpdate.display_name = displayName
    if (theme) profileUpdate.theme = theme
    if (onboardingCompleted !== null) profileUpdate.onboarding_completed = onboardingCompleted
    if (preferredSubject) profileUpdate.preferred_subject = preferredSubject

    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      ...profileUpdate,
    })

    if (profileError) {
      throw profileError
    }

    if (displayName) {
      await supabase.auth.updateUser({
        data: { display_name: displayName },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update profile error', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
