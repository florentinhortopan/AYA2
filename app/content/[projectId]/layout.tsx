import { ReactNode } from 'react'
import { ProjectChatbot } from '@/components/content/project-chatbot'

export default function ProjectLayout({
  children,
  params
}: {
  children: ReactNode
  params: { projectId: string }
}) {
  return (
    <>
      {children}
      <ProjectChatbot projectId={params.projectId} />
    </>
  )
}
