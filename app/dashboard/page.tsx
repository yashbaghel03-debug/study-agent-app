import { createClient } from '@/lib/supabase/server'
import SiteNav from '../components/site-nav'
import DashboardClient from './dashboard-client'

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

export const dynamic = 'force-dynamic'

function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SiteNav currentPage="dashboard" />
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-slate-300">
          {children}
        </div>
      </main>
    </div>
  )
}

async function loadDashboardConcepts(): Promise<
  { status: 'unauthenticated' } | { status: 'empty' } | { status: 'ok'; concepts: ConceptRecord[] }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: 'unauthenticated' }
  }

  const { data, error } = await supabase
    .from('concepts')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Failed to load concepts', error)
    return { status: 'empty' }
  }

  return { status: 'ok', concepts: (data ?? []) as ConceptRecord[] }
}

export default async function DashboardPage() {
  const result = await loadDashboardConcepts()

  if (result.status === 'unauthenticated') {
    return (
      <DashboardShell>
        Sign in to view your concept mastery dashboard.
      </DashboardShell>
    )
  }

  if (result.status === 'empty') {
    return (
      <DashboardShell>
        No concepts are available yet. Start a chat and save progress to populate your dashboard.
      </DashboardShell>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <SiteNav currentPage="dashboard" />
      <DashboardClient concepts={result.concepts} />
    </div>
  )
}
