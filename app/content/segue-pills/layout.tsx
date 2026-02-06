'use client'

import { ReactNode, useEffect } from 'react'
import { ProjectChatbot } from '@/components/content/project-chatbot'

export default function SeguePillsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Log when layout loads to verify page is correct
  useEffect(() => {
    console.log('[Pills] ===== SEGUE PILLS LAYOUT LOADED =====')
    console.log('[Pills] This page should show the pills feature')
    console.log('PILLS DEBUG: Layout loaded - chatbot should appear with pills feature enabled')
  }, [])

  return (
    <>
      {children}
      {/* Chatbot widget for testing pills - enable pills feature in segue pills lab */}
      <ProjectChatbot projectId="" showPillsFeature={true} />
    </>
  )
}
