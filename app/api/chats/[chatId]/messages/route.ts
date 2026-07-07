import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const { chatId } = await params
    const supabase = createClient()

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
