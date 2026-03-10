'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function ImmersiveLauncherPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [message, setMessage] = useState('Loading immersive workspace...')

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (!session?.user?.id) {
      router.replace('/auth/signin')
      return
    }

    const openLatestProject = async () => {
      try {
        const response = await fetch('/api/content-tool/projects')
        const data = await response.json()
        const firstProjectId = data?.projects?.[0]?.id

        if (firstProjectId) {
          router.replace(`/content/${firstProjectId}/immersive`)
          return
        }

        setMessage('No content projects found yet. Create one from Content first.')
      } catch {
        setMessage('Could not load projects. Please try again from the Content page.')
      }
    }

    openLatestProject()
  }, [router, session?.user?.id, status])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <p className="text-sm text-muted-foreground">{message}</p>
    </main>
  )
}
