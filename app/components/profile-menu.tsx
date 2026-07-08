'use client'

import { useEffect, useState } from 'react'

type ProfileMenuProps = {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileMenu({ isOpen, onClose }: ProfileMenuProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-sm border-l border-white/10 bg-[#081124]/95 p-6 shadow-2xl shadow-black/40 transition-all duration-300"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Profile</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Ava Chen</h2>
          </div>
          <button className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/5" onClick={onClose} aria-label="Close profile panel">
            ✕
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-lg font-semibold text-white">
            AC
          </div>
          <div>
            <p className="font-semibold text-white">Ava Chen</p>
            <p className="text-sm text-slate-400">AI Learning Coach</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm text-slate-300">
          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</p>
            <p className="mt-1">ava@studyagent.dev</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Account Status</p>
            <p className="mt-1">Verified</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Plan</p>
            <p className="mt-1">Premium</p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <button className="flex w-full items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10">
            <span>Settings</span>
            <span>⚙️</span>
          </button>
          <button className="flex w-full items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10">
            <span>Theme</span>
            <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
          </button>
          <button className="flex w-full items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10">
            <span>Help & Support</span>
            <span>❓</span>
          </button>
        </div>

        <button className="mt-8 w-full rounded-[1.25rem] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20">
          Logout
        </button>
      </div>
    </div>
  )
}
