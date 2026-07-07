import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const body = await request.json()
    const title = typeof body?.title === 'string' ? body.title : ''
    const { chatId } = await params

    if (!title.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const supabase = createClient()

    const { error } = await supabase.from('chats').update({ title }).eq('id', chatId)

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
    const { chatId } = await params
    const supabase = createClient()

    const { error } = await supabase.from('chats').delete().eq('id', chatId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete chat error', error)
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}
