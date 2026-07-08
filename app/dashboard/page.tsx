import { createClient } from '@/lib/supabase'
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
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from('concepts').select('*')

    if (error) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <SiteNav currentPage="dashboard" />
          <main className="px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-slate-300">
              No concepts are available yet. Start a chat and save progress to populate your dashboard.
            </div>
          </main>
        </div>
      )
    }

    const concepts = (data ?? []) as ConceptRecord[]

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <SiteNav currentPage="dashboard" />
        <DashboardClient concepts={concepts} />
      </div>
    )
  } catch (error) {
    console.error('Failed to load concepts', error)
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <SiteNav currentPage="dashboard" />
        <main className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-slate-300">
            No concepts are available yet. Start a chat and save progress to populate your dashboard.
          </div>
        </main>
      </div>
    )
  }
}
