import Link from 'next/link'

type SiteNavProps = {
  currentPage: 'chat' | 'dashboard'
}

const navItems = [
  { href: '/', label: 'Chat' },
  { href: '/dashboard', label: 'Dashboard' },
] as const

export default function SiteNav({ currentPage }: SiteNavProps) {
  return (
    <nav className="border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-wide text-white">
          Study Agent
        </Link>
        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = currentPage === (item.href === '/dashboard' ? 'dashboard' : 'chat')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-200'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
