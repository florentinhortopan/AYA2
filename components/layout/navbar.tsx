'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useSession, signIn, signOut } from 'next-auth/react'

export function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-gold">
              AYAYA2
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/explore" className="text-sm font-medium text-foreground hover:text-gold transition-colors">
                Explore
              </Link>
              {session && (
                <>
                  <Link href="/dashboard" className="text-sm font-medium text-foreground hover:text-gold transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/community" className="text-sm font-medium text-foreground hover:text-gold transition-colors">
                    Community
                  </Link>
                  <Link href="/insights" className="text-sm font-medium text-foreground hover:text-gold transition-colors">
                    Recruiter View
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {status === 'loading' ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded" />
            ) : session ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {session.user?.name || session.user?.email}
                </span>
                <Button variant="ghost" onClick={() => signOut()} className="hover:text-gold">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => signIn()} className="hover:text-gold">
                  Sign In
                </Button>
                <Link href="/signup">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

