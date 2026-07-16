'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from './theme-provider'

type ProfileData = {
  id: string
  email: string | null
  displayName: string
  avatarUrl: string | null
  theme: 'dark' | 'light'
  plan: string
  status: string
}

type ProfileMenuProps = {
  isOpen: boolean
  onClose: () => void
  initials: string
  onProfileUpdated?: (profile: ProfileData) => void
}

export default function ProfileMenu({ isOpen, onClose, initials, onProfileUpdated }: ProfileMenuProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    let cancelled = false

    const loadProfile = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/profile')
        if (!response.ok) {
          throw new Error('Failed to load profile')
        }
        const data = (await response.json()) as ProfileData
        if (cancelled) return
        setProfile(data)
        setDisplayName(data.displayName)
        if (data.theme === 'light' || data.theme === 'dark') {
          window.localStorage.setItem('study-agent-theme', data.theme)
          document.documentElement.classList.remove('theme-dark', 'theme-light')
          document.documentElement.classList.add(data.theme === 'light' ? 'theme-light' : 'theme-dark')
          document.documentElement.dataset.theme = data.theme
          setTheme(data.theme)
        }
        onProfileUpdated?.(data)
      } catch {
        if (!cancelled) setError('Could not load your profile.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadProfile()

    return () => {
      cancelled = true
      window.removeEventListener('keydown', onKeyDown)
    }
    // Intentionally only re-run when the panel opens/closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  if (!isOpen) return null

  const handleSaveSettings = async (event: FormEvent) => {
    event.preventDefault()
    if (!displayName.trim()) {
      setError('Display name is required.')
      return
    }

    setIsSaving(true)
    setError(null)
    setSavedMessage(null)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: displayName.trim(), theme }),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      const nextProfile = profile
        ? { ...profile, displayName: displayName.trim(), theme }
        : null
      if (nextProfile) {
        setProfile(nextProfile)
        onProfileUpdated?.(nextProfile)
      }
      setSavedMessage('Settings saved.')
      setShowSettings(false)
    } catch {
      setError('Could not save settings.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  const handleThemeToggle = () => {
    const next: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    if (profile) {
      const nextProfile: ProfileData = { ...profile, theme: next }
      setProfile(nextProfile)
      onProfileUpdated?.(nextProfile)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-sm border-l border-white/10 bg-[#081124]/95 p-6 shadow-2xl shadow-black/40 transition-all duration-300"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Profile</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {isLoading ? 'Loading…' : profile?.displayName || 'Your account'}
            </h2>
          </div>
          <button
            className="rounded-full border border-white/10 p-2 text-slate-300 hover:bg-white/5"
            onClick={onClose}
            aria-label="Close profile panel"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-sky-600 text-lg font-semibold text-white">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-white">{profile?.displayName || 'Learner'}</p>
            <p className="text-sm text-slate-400">{profile?.email || 'Signed in'}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-sm text-slate-300">
          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</p>
            <p className="mt-1 break-all">{profile?.email || '—'}</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Account Status</p>
            <p className="mt-1">{profile?.status || '—'}</p>
          </div>
          <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Plan</p>
            <p className="mt-1">{profile?.plan || 'Free'}</p>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        ) : null}
        {savedMessage ? (
          <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
            {savedMessage}
          </div>
        ) : null}

        {showSettings ? (
          <form className="mt-6 space-y-3" onSubmit={(event) => void handleSaveSettings(event)}>
            <label className="block space-y-2 text-sm text-slate-300">
              <span>Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#061026] px-3 py-2 outline-none focus:border-cyan-400"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 rounded-2xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-200"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 space-y-2">
            <button
              className="flex w-full items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
              onClick={() => setShowSettings(true)}
            >
              <span>Settings</span>
              <span>⚙️</span>
            </button>
            <button
              className="flex w-full items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
              onClick={handleThemeToggle}
            >
              <span>Theme</span>
              <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
            <a
              href="mailto:support@studyagent.app"
              className="flex w-full items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
            >
              <span>Help & Support</span>
              <span>❓</span>
            </a>
          </div>
        )}

        <button
          className="mt-8 w-full rounded-[1.25rem] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
          onClick={() => void handleLogout()}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Signing out…' : 'Logout'}
        </button>
      </div>
    </div>
  )
}
