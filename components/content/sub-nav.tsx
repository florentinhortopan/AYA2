'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Beaker, ClipboardCheck, BookOpenText, ShieldCheck } from 'lucide-react'

import { cn } from '@/lib/utils'

type SubNavItem = {
  label: string
  href: string
  match: (pathname: string) => boolean
  icon: React.ComponentType<{ className?: string }>
  description?: string
}

const ITEMS: SubNavItem[] = [
  {
    label: 'Q&A Projects',
    href: '/content',
    match: (p) =>
      p === '/content' ||
      p === '/content/new' ||
      (p.startsWith('/content/') &&
        !p.startsWith('/content/segue-pills') &&
        !p.startsWith('/content/testing') &&
        !p.startsWith('/content/prompts') &&
        !p.startsWith('/content/guidelines')),
    icon: FileText,
    description: 'Build and refine Q&A content.',
  },
  {
    label: 'Pill Research',
    href: '/content/segue-pills/list',
    match: (p) => p.startsWith('/content/segue-pills'),
    icon: Beaker,
    description: 'Discover segue pills for chatbot follow-ups.',
  },
  {
    label: 'Content Testing',
    href: '/content/testing',
    match: (p) => p.startsWith('/content/testing'),
    icon: ClipboardCheck,
    description: 'Run guided moderator-driven content tests.',
  },
  {
    label: 'Prompts',
    href: '/content/prompts',
    match: (p) => p.startsWith('/content/prompts'),
    icon: BookOpenText,
    description: 'Manage prompt templates.',
  },
  {
    label: 'Guidelines',
    href: '/content/guidelines',
    match: (p) => p.startsWith('/content/guidelines'),
    icon: ShieldCheck,
    description: 'Maintain editorial content guidelines.',
  },
]

export function ContentSubNav() {
  const pathname = usePathname() ?? '/content'

  return (
    <nav className="mb-8 border-b border-border/60" aria-label="Content sections">
      <div className="flex flex-wrap items-center gap-1 overflow-x-auto">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.match(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
