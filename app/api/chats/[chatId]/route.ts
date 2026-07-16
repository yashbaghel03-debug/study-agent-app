import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const auth = await requireUser()
    if (auth.error) return auth.error

    const { user, supabase } = auth
    const body = await request.json()
    const title = typeof body?.title === 'string' ? body.title : ''
    const { chatId } = await params

    if (!title.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('chats')
      .update({ title })
      .eq('id', chatId)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update chat error', error)
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const auth = await requireUser()
    if (auth.error) return auth.error

    const { user, supabase } = auth
    const { chatId } = await params

    const { error } = await supabase.from('chats').delete().eq('id', chatId).eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete chat error', error)
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}
