import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

export async function POST() {
  try {
    const auth = await requireUser()
    if (auth.error) return auth.error

    const { user, supabase } = auth

    const { data, error } = await supabase
      .from('chats')
      .insert({ title: null, user_id: user.id })
      .select('id')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ id: data.id })
  } catch (error) {
    console.error('Create chat error', error)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const auth = await requireUser()
    if (auth.error) return auth.error

    const { user, supabase } = auth

    const { data, error } = await supabase
      .from('chats')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('List chats error', error)
    return NextResponse.json({ error: 'Failed to list chats' }, { status: 500 })
  }
}
