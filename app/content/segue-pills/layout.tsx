import { ReactNode } from 'react'
import { ProjectChatbot } from '@/components/content/project-chatbot'

export default function SeguePillsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      {/* Chatbot widget for testing pills - enable pills feature in segue pills lab */}
      <ProjectChatbot projectId="" showPillsFeature={true} />
    </>
  )
}
