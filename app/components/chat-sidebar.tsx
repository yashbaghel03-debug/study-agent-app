'use client'

import { useMemo, useState } from 'react'

type ChatSummary = {
  id: string
  title: string | null
  created_at: string
}

type ChatSidebarProps = {
  chats: ChatSummary[]
  activeChatId: string | null
  isCollapsed: boolean
  onToggleCollapsed: () => void
  onToggleMobile: () => void
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  onRenameChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
}

function getRelativeDate(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000))

  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function getGroupLabel(createdAt: string) {
  const createdDate = new Date(createdAt)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const isToday = createdDate.toDateString() === today.toDateString()
  const isYesterday = createdDate.toDateString() === yesterday.toDateString()

  if (isToday) return 'Today'
  if (isYesterday) return 'Yesterday'
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  if (createdDate >= weekAgo) return 'Last 7 Days'
  return 'Older'
}

export default function ChatSidebar({
  chats,
  activeChatId,
  isCollapsed,
  onToggleCollapsed,
  onToggleMobile,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return chats
    return chats.filter((chat) => (chat.title || 'Untitled chat').toLowerCase().includes(term))
  }, [chats, search])

  const groupedChats = useMemo(() => {
    return filteredChats.reduce<Record<string, ChatSummary[]>>((acc, chat) => {
      const group = getGroupLabel(chat.created_at)
      acc[group] = acc[group] ? [...acc[group], chat] : [chat]
      return acc
    }, {})
  }, [filteredChats])

  return (
    <div className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-[#081124]/90 shadow-[0_45px_120px_-50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          {!isCollapsed ? (
            <>
              <p className="text-sm font-semibold tracking-wide text-cyan-200">Study Agent</p>
              <p className="text-xs text-slate-400">3D learning workspace</p>
            </>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-sm font-semibold text-cyan-200">
              SA
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-white/10 bg-slate-900/40 p-2 text-slate-200 transition duration-200 hover:bg-slate-800/70 lg:hidden"
            onClick={onToggleMobile}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <button
            className="hidden rounded-full border border-white/10 bg-slate-900/40 p-2 text-slate-200 transition duration-200 hover:bg-slate-800/70 lg:inline-flex"
            onClick={onToggleCollapsed}
            aria-label="Collapse sidebar"
          >
            {isCollapsed ? '›' : '‹'}
          </button>
        </div>
      </div>

      <div className="border-b border-white/10 p-4">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] border border-cyan-400/30 bg-cyan-500/15 px-4 py-3 text-sm font-semibold text-cyan-200 transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-500/25"
          onClick={onNewChat}
        >
          <span className="text-base">＋</span>
          {!isCollapsed ? 'New Chat' : ''}
        </button>
      </div>

      {!isCollapsed ? (
        <div className="px-4 py-3">
          <label className="flex items-center gap-2 rounded-[1.2rem] border border-white/10 bg-[#0d172b]/90 px-3 py-2 text-sm text-slate-400">
            <span>🔎</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search chats"
              className="w-full bg-transparent outline-none placeholder:text-slate-500"
            />
          </label>
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {Object.entries(groupedChats).length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-400">
            {search ? 'No chats matched your search.' : 'No chat history yet.'}
          </div>
        ) : (
          Object.entries(groupedChats).map(([group, items]) => (
            <div key={group} className="mb-4">
              {!isCollapsed ? <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{group}</p> : null}
              <div className="space-y-2">
                {items.map((chat) => {
                  const isActive = activeChatId === chat.id
                  return (
                    <div key={chat.id} className="group relative">
                      <button
                        type="button"
                        onClick={() => onSelectChat(chat.id)}
                        className={`flex w-full items-center justify-between rounded-[1.25rem] border px-3 py-3 text-left transition duration-200 ${
                          isActive
                            ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100'
                            : 'border-white/5 bg-[#0d172b]/90 text-slate-300 hover:border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{chat.title || 'Untitled chat'}</p>
                          {!isCollapsed ? <p className="mt-1 text-xs tracking-wide text-slate-400">{getRelativeDate(chat.created_at)}</p> : null}
                        </div>
                      </button>
                      {!isCollapsed ? (
                        <div className="absolute right-2 top-2">
                          <button
                            className="rounded-full border border-white/10 bg-slate-950/80 p-1.5 text-xs text-slate-300 transition hover:border-cyan-300 hover:text-cyan-200"
                            aria-label="Open chat options"
                            onClick={(event) => {
                              event.stopPropagation()
                              setMenuOpenId((current) => (current === chat.id ? null : chat.id))
                            }}
                          >
                            ⋯
                          </button>
                          {menuOpenId === chat.id ? (
                            <div className="absolute right-0 top-9 z-20 w-36 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-xl">
                              <button
                                className="flex w-full items-center rounded-xl px-2 py-2 text-sm text-slate-200 hover:bg-white/5"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setMenuOpenId(null)
                                  onRenameChat(chat.id)
                                }}
                              >
                                Rename
                              </button>
                              <button
                                className="flex w-full items-center rounded-xl px-2 py-2 text-sm text-rose-300 hover:bg-white/5"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setMenuOpenId(null)
                                  onDeleteChat(chat.id)
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
