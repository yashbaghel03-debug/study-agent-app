'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'
  const authError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(
    authError === 'auth_callback_failed' ? 'Email confirmation failed. Please try again.' : null,
  )
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setIsLoading(false)
        return
      }

      router.replace(next.startsWith('/') ? next : '/')
      router.refresh()
    } catch {
      setError('Unable to sign in right now.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_24%),linear-gradient(180deg,#02040d_0%,#050813_100%)] px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#081124]/90 p-8 shadow-[0_30px_90px_-55px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Study Agent</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in to continue your private study workspace.</p>

        <form className="mt-8 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
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
              placeholder="••••••••"
            />
          </label>

          <div className="text-right text-sm">
            <Link href="/forgot-password" className="font-semibold text-cyan-200 hover:text-cyan-100">
              Forgot password?
            </Link>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          New here?{' '}
          <Link href="/signup" className="font-semibold text-cyan-200 hover:text-cyan-100">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
