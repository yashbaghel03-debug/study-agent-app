'use client'

import { useMemo, useState } from 'react'

type ConceptRecord = {
  id: string
  subject: string
  concept: string
  mastery_level: string | null
  mastery_score: number | null
  strong_areas: string[] | null
  weak_areas: string[] | null
  next_steps: string[] | null
  updated_at: string | null
  created_at?: string | null
}

type DashboardClientProps = {
  concepts: ConceptRecord[]
}

const subjectStyles: Record<string, string> = {
  Physics: 'bg-blue-500/15 text-blue-300 ring-blue-400/20',
  Biology: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20',
  Mathematics: 'bg-violet-500/15 text-violet-300 ring-violet-400/20',
  'Computer Science': 'bg-amber-500/15 text-amber-300 ring-amber-400/20',
  Chemistry: 'bg-rose-500/15 text-rose-300 ring-rose-400/20',
}

const masteryStyles: Record<string, string> = {
  Strong: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20',
  Proficient: 'bg-sky-500/15 text-sky-300 ring-sky-400/20',
  Developing: 'bg-amber-500/15 text-amber-300 ring-amber-400/20',
  Introduced: 'bg-slate-500/15 text-slate-300 ring-slate-400/20',
  'In Progress': 'bg-zinc-500/15 text-zinc-300 ring-zinc-400/20',
}

function mapMasteryLevel(level: string | null | undefined) {
  switch (level?.toLowerCase()) {
    case 'strong':
      return 4
    case 'proficient':
      return 3
    case 'developing':
      return 2
    case 'introduced':
      return 1
    case 'in progress':
    case 'in_progress':
      return 0
    default:
      return null
  }
}

function getPercentValue(record: ConceptRecord) {
  const mapped = mapMasteryLevel(record.mastery_level)
  if (mapped !== null) {
    return Math.round((mapped / 4) * 100)
  }

  if (typeof record.mastery_score === 'number' && Number.isFinite(record.mastery_score)) {
    return Math.max(0, Math.min(100, Math.round(record.mastery_score)))
  }

  return 0
}

function formatDate(value: string | null | undefined, fallbackValue?: string | null) {
  const dateValue = value || fallbackValue
  if (!dateValue) return 'Not updated yet'
  return new Date(dateValue).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function DashboardClient({ concepts }: DashboardClientProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const total = concepts.length
    const uniqueSubjects = new Set(concepts.map((concept) => concept.subject)).size
    const averagePercent =
      total === 0
        ? 0
        : Math.round(
            concepts.reduce((sum, concept) => sum + getPercentValue(concept), 0) / total,
          )

    return { total, uniqueSubjects, averagePercent }
  }, [concepts])

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Study dashboard</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Your concept mastery overview</h1>
          <p className="max-w-2xl text-sm text-slate-400 sm:text-base">
            Track progress across subjects, review strengths and weaknesses, and keep your next steps visible.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-black/20">
            <p className="text-sm text-slate-400">Total concepts studied</p>
            <p className="mt-2 text-3xl font-semibold text-white">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-black/20">
            <p className="text-sm text-slate-400">Unique subjects</p>
            <p className="mt-2 text-3xl font-semibold text-white">{stats.uniqueSubjects}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-black/20">
            <p className="text-sm text-slate-400">Average mastery score</p>
            <p className="mt-2 text-3xl font-semibold text-white">{stats.averagePercent}%</p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {concepts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-10 text-center text-slate-400 lg:col-span-2">
              No concepts have been saved yet. Start a study session to populate this dashboard.
            </div>
          ) : (
            concepts.map((concept) => {
              const percent = getPercentValue(concept)
              const isExpanded = expandedId === concept.id
              const subjectClass = subjectStyles[concept.subject] ?? 'bg-slate-600/15 text-slate-300 ring-slate-500/20'
              const masteryClass = masteryStyles[concept.mastery_level ?? ''] ?? 'bg-slate-600/15 text-slate-300 ring-slate-500/20'

              return (
                <article
                  key={concept.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg shadow-black/20"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId((current) => (current === concept.id ? null : concept.id))}
                    className="flex w-full flex-col gap-4 text-left"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${subjectClass}`}>
                        {concept.subject}
                      </span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${masteryClass}`}>
                        {concept.mastery_level ?? 'Unrated'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-white">{concept.concept}</h2>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>{percent}% mastery</span>
                        <span>Updated {formatDate(concept.updated_at, concept.created_at)}</span>
                      </div>
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="mt-4 space-y-4 border-t border-slate-800 pt-4">
                      <div>
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Strong areas</h3>
                        <div className="flex flex-wrap gap-2">
                          {(concept.strong_areas ?? []).length ? (
                            (concept.strong_areas ?? []).map((item) => (
                              <span key={item} className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-300">
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">No strong areas recorded.</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-rose-300">Weak areas</h3>
                        <div className="flex flex-wrap gap-2">
                          {(concept.weak_areas ?? []).length ? (
                            (concept.weak_areas ?? []).map((item) => (
                              <span key={item} className="rounded-full bg-rose-500/15 px-3 py-1 text-sm text-rose-300">
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">No weak areas recorded.</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Next steps</h3>
                        <div className="flex flex-wrap gap-2">
                          {(concept.next_steps ?? []).length ? (
                            (concept.next_steps ?? []).map((item) => (
                              <span key={item} className="rounded-full bg-sky-500/15 px-3 py-1 text-sm text-sky-300">
                                {item}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">No next steps recorded.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            })
          )}
        </section>
      </div>
    </main>
  )
}
