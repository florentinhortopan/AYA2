'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AnswerValidationStatus, ContentProject, QuestionStatus } from '@/types/content'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ProjectChatbotProps {
  projectId: string
}

export function ProjectChatbot({ projectId }: ProjectChatbotProps) {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<ContentProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState(projectId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [questionStatuses, setQuestionStatuses] = useState<QuestionStatus[]>(['approved'])
  const [answerStatuses, setAnswerStatuses] = useState<AnswerValidationStatus[]>(['approved'])
  const endRef = useRef<HTMLDivElement>(null)
  const projectName = projects.find((project) => project.id === selectedProjectId)?.name || 'Project'
  const questionStatusOptions: QuestionStatus[] = ['approved', 'pending', 'draft', 'rejected', 'published']
  const answerStatusOptions: AnswerValidationStatus[] = [
    'approved',
    'pending',
    'draft',
    'valid',
    'needs_review',
    'invalid'
  ]

  useEffect(() => {
    setSelectedProjectId(projectId)
  }, [projectId])

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Ask me about this project’s Q&A set and I’ll respond using the latest answers.',
          timestamp: new Date().toISOString()
        }
      ])
    }
  }, [messages.length])

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/content-tool/projects')
        if (!response.ok) {
          return
        }
        const data = await response.json()
        setProjects(data.projects || [])
      } catch (error) {
        setProjects([])
      }
    }

    loadProjects()
  }, [])

  const toggleQuestionStatus = (status: QuestionStatus) => {
    setQuestionStatuses((current) => {
      if (current.includes(status)) {
        return current.length === 1 ? current : current.filter((item) => item !== status)
      }
      return [...current, status]
    })
  }

  const toggleAnswerStatus = (status: AnswerValidationStatus) => {
    setAnswerStatuses((current) => {
      if (current.includes(status)) {
        return current.length === 1 ? current : current.filter((item) => item !== status)
      }
      return [...current, status]
    })
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) {
      return
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString()
    }

    setMessages((current) => [...current, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`/api/content-tool/projects/${selectedProjectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          questionStatuses,
          answerStatuses,
          history: messages.slice(-6)
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to fetch response.')
      }

      const metaParts: string[] = []
      if (data.variantLevel) {
        metaParts.push(`Tone: ${String(data.variantLevel).replace('_', ' ')}`)
      }
      if (data.matchedQuestionStatus) {
        metaParts.push(`Question: ${String(data.matchedQuestionStatus).replace('_', ' ')}`)
      }
      if (data.matchedAnswerStatus) {
        metaParts.push(`Answer: ${String(data.matchedAnswerStatus).replace('_', ' ')}`)
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: [
          data.response || 'I could not find an answer for that yet.',
          data.matchedQuestionText ? `Matched question: ${data.matchedQuestionText}` : null,
          data.matchedSourceLink ? `Source: ${data.matchedSourceLink}` : null,
          metaParts.length > 0 ? `Status: ${metaParts.join(' · ')}` : null
        ]
          .filter(Boolean)
          .join('\n'),
        timestamp: new Date().toISOString()
      }
      setMessages((current) => [...current, assistantMessage])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'Sorry, I ran into an error. Please try again.',
          timestamp: new Date().toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <Card className="w-[360px] shadow-xl border-border bg-card mb-3">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Project Sandbox Assistant</p>
              <p className="text-xs text-muted-foreground">{projectName}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
          <div className="border-b border-border px-4 py-3 space-y-3">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Project</p>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Question status filters</p>
              <div className="flex flex-wrap gap-1">
                {questionStatusOptions.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={questionStatuses.includes(status) ? 'default' : 'outline'}
                    onClick={() => toggleQuestionStatus(status)}
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Answer status filters</p>
              <div className="flex flex-wrap gap-1">
                {answerStatusOptions.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={answerStatuses.includes(status) ? 'default' : 'outline'}
                    onClick={() => toggleAnswerStatus(status)}
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="max-h-[360px] overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <div className="space-y-2">
                    {message.content.split('\n').map((line, idx) => (
                      <p key={idx} className="text-xs whitespace-pre-wrap">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <p className="text-xs text-muted-foreground">Thinking...</p>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t border-border px-4 py-3 flex gap-2">
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Ask about this project..."
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()}>
              Send
            </Button>
          </div>
        </Card>
      )}
      {!open && (
        <Button className="shadow-lg" onClick={() => setOpen(true)}>
          Chat
        </Button>
      )}
    </div>
  )
}
