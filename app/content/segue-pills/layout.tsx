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
    
    // Note about CSP errors
    console.info('[CSP] If you see CSP errors about Vercel scripts, see CSP_DEBUG_GUIDE.md for solutions')
    console.info('[CSP] These errors are harmless and do NOT affect pills functionality')
  }, [])

  return (
    <>
      {children}
      {/* Chatbot widget for testing pills - enable pills feature in segue pills lab */}
      <ProjectChatbot projectId="" showPillsFeature={true} />
    </>
  )
}
