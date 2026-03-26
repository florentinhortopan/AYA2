'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const iterations = [
  { id: 'v1', href: '/campaigns/field-tested/v1', label: 'Version 1' },
  { id: 'v2', href: '/campaigns/field-tested/v2', label: 'Version 2' },
  { id: 'v3', href: '/campaigns/field-tested/v3', label: 'Version 3' },
  { id: 'v4', href: '/campaigns/field-tested/v4', label: 'Version 4' }
]

export function FieldTestedTopNav() {
  const pathname = usePathname()

  return (
    <div className="sticky top-16 z-30 border-y border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Field Tested</p>
          <p className="text-sm font-semibold text-foreground">Design Iterations</p>
        </div>
        <nav className="flex items-center gap-2">
          {iterations.map((iteration) => {
            const isActive = pathname === iteration.href
            return (
              <Link
                key={iteration.id}
                href={iteration.href}
                className={cn(
                  'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground hover:border-primary/40 hover:text-primary'
                )}
              >
                {iteration.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
