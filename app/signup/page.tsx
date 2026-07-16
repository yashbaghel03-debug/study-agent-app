'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim() || email.trim().split('@')[0],
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setIsLoading(false)
        return
      }

      if (data.session) {
        router.replace('/')
        router.refresh()
        return
      }

      setMessage('Check your email to confirm your account, then sign in.')
      setIsLoading(false)
    } catch {
      setError('Unable to create your account right now.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_24%),linear-gradient(180deg,#02040d_0%,#050813_100%)] px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#081124]/90 p-8 shadow-[0_30px_90px_-55px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Study Agent</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Create your account</h1>
        <p className="mt-2 text-sm text-slate-400">Your chats and mastery progress stay private to you.</p>

        <form className="mt-8 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block space-y-2 text-sm">
            <span className="text-slate-300">Display name</span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#061026] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="Alex"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="text-slate-300">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#061026] px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="you@email.com"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="text-slate-300">Password</span>
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
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-cyan-200 hover:text-cyan-100">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
