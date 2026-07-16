import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const auth = await requireUser()
    if (auth.error) return auth.error

    const { user, supabase } = auth
    const { chatId } = await params

    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('id')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (chatError) {
      throw chatError
    }

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('messages')
      .select('id, chat_id, role, content, image_url, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('List chat messages error', error)
    return NextResponse.json({ error: 'Failed to list chat messages' }, { status: 500 })
  }
}
