'use client'

import { useState } from 'react'

const SUBJECT_OPTIONS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'History',
  'Languages',
  'General Study',
]

type OnboardingModalProps = {
  preferredSubject?: string | null
  onComplete: (preferredSubject: string) => Promise<void>
}

export default function OnboardingModal({ preferredSubject, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const [subject, setSubject] = useState(preferredSubject || 'General Study')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFinish = async () => {
    setIsSaving(true)
    setError(null)

    try {
      await onComplete(subject)
    } catch {
      setError('Unable to save your preferences right now.')
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#081124]/95 p-8 shadow-[0_30px_90px_-55px_rgba(0,0,0,0.85)]">
        {step === 0 ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Welcome</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Your private study workspace</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              Study Agent helps you learn with AI tutoring, photo uploads, and a personal mastery dashboard.
              Everything you save stays private to your account.
            </p>
            <button
              className="mt-8 w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              onClick={() => setStep(1)}
            >
              Get started
            </button>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Step 1 of 2</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">What are you studying?</h2>
            <p className="mt-2 text-sm text-slate-400">Pick a focus area. You can always study other subjects too.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {SUBJECT_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSubject(option)}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                    subject === option
                      ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                      : 'border-white/10 bg-slate-900/50 text-slate-300 hover:border-white/20'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <button
                className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                onClick={() => setStep(0)}
              >
                Back
              </button>
              <button
                className="flex-1 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                onClick={() => setStep(2)}
              >
                Continue
              </button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">Step 2 of 2</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">How to use Study Agent</h2>
            <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-300">
              <li className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3">
                <span className="font-semibold text-cyan-200">Chat</span> — ask questions and get step-by-step tutoring.
              </li>
              <li className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3">
                <span className="font-semibold text-cyan-200">Upload photos</span> — attach notes or problems; your text and images are saved automatically.
              </li>
              <li className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3">
                <span className="font-semibold text-cyan-200">Dashboard</span> — track mastery, strengths, and next steps.
              </li>
            </ul>

            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <div className="mt-8 flex gap-3">
              <button
                className="flex-1 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                onClick={() => setStep(1)}
                disabled={isSaving}
              >
                Back
              </button>
              <button
                className="flex-1 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
                onClick={() => void handleFinish()}
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Start studying'}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
