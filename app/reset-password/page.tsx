'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (cancelled) return

      if (!user) {
        router.replace('/login?next=/reset-password')
        return
      }

      setIsCheckingSession(false)
    })()

    return () => {
      cancelled = true
    }
  }, [router])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        setIsLoading(false)
        return
      }

      setMessage('Password updated. Redirecting to your workspace…')
      setTimeout(() => {
        router.replace('/')
        router.refresh()
      }, 1200)
    } catch {
      setError('Unable to update your password right now.')
      setIsLoading(false)
    }
  }

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_24%),linear-gradient(180deg,#02040d_0%,#050813_100%)] px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#081124]/90 p-8 shadow-[0_30px_90px_-55px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Study Agent</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Choose a new password</h1>
        <p className="mt-2 text-sm text-slate-400">Use at least 6 characters for your new password.</p>

        <form className="mt-8 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block space-y-2 text-sm">
            <span className="text-slate-300">New password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#061026] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="At least 6 characters"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="text-slate-300">Confirm password</span>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#061026] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="Repeat your password"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {isLoading ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link href="/login" className="font-semibold text-cyan-200 hover:text-cyan-100">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
