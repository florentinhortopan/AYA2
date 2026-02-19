'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AgentType, RichAgentResponse } from '@/types'
import { UIComponentsRenderer } from './ui-components-renderer'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  components?: RichAgentResponse['components']
  segues?: RichAgentResponse['segues']
}

interface AgentChatProps {
  agentType: AgentType
  userId?: string
  titleOverride?: string
  containerClassName?: string
  messagesHeightClassName?: string
  hideHeader?: boolean
}

export function AgentChat({
  agentType,
  userId,
  titleOverride,
  containerClassName,
  messagesHeightClassName,
  hideHeader = false
}: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Initialize with agent's greeting
    if (!initialized) {
      const initEndpoint = agentType === 'job-finder' ? '/api/job-finder/chat' : `/api/agents/${agentType}`
      fetch(initEndpoint)
        .then(res => res.json())
        .then(data => {
          if (data.initialMessage) {
            setMessages([{
              role: 'assistant',
              content: data.initialMessage,
              timestamp: new Date().toISOString()
            }])
            setInitialized(true)
          }
        })
        .catch(console.error)
    }
  }, [agentType, initialized])

  const sendMessageInternal = async (content: string) => {
    if (!content.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const endpoint = agentType === 'job-finder' ? '/api/job-finder/chat' : `/api/agents/${agentType}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId,
          userId,
          history: messages
        })
      })

      const data = await response.json()

      // Handle both legacy response format and rich UI format
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.text || data.response || 'I apologize, but I could not generate a response.',
        timestamp: new Date().toISOString(),
        components: data.components || [],
        segues: data.segues || []
      }
      
      setMessages(prev => [...prev, assistantMessage])
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    await sendMessageInternal(input)
  }

  const handleAction = async (action: string, data?: Record<string, unknown>) => {
    if (action?.startsWith('ask:')) {
      const prompt = action.replace(/^ask:/, '').trim()
      if (prompt) {
        await sendMessageInternal(prompt)
      }
      return
    }

    if (!userId) {
      // Prompt user to sign in
      const confirmSignIn = confirm('Please sign in to perform this action. Would you like to sign in now?')
      if (confirmSignIn) {
        window.location.href = '/auth/signin'
      }
      return
    }

    setActionLoading(action)

    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Action failed')
      }

      // Show success message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.message || 'Action completed successfully!',
        timestamp: new Date().toISOString()
      }])

      // Handle redirect if provided
      if (result.redirect) {
        setTimeout(() => {
          window.location.href = result.redirect
        }, 1000)
      }

      // Refresh page data if needed
      if (result.refresh) {
        window.location.reload()
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I couldn't complete that action: ${error.message || 'Unknown error'}`,
        timestamp: new Date().toISOString()
      }])
    } finally {
      setActionLoading(null)
    }
  }

  const agentNames: Record<AgentType, string> = {
    recruitment: 'Recruitment Assistant',
    training: 'Training Assistant',
    financial: 'Financial Assistant',
    educational: 'Educational Assistant',
    'job-finder': 'Job Finder Assistant'
  }

  return (
    <Card className={`w-full max-w-3xl mx-auto border-border bg-card ${containerClassName || ''}`.trim()}>
      {!hideHeader && (
        <CardHeader>
          <CardTitle className="text-2xl text-gold font-bold">{titleOverride || agentNames[agentType]}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className={`${messagesHeightClassName || 'h-96'} overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-lg border border-border`}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.components && msg.components.length > 0 && (
                  <UIComponentsRenderer 
                    components={msg.components}
                    onAction={async (action, data) => {
                      await handleAction(action, data)
                    }}
                    actionLoading={actionLoading}
                  />
                )}
                {msg.segues && msg.segues.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                    <p className="text-xs text-muted-foreground mb-2">You might also want to:</p>
                    {msg.segues.map((segue, idx) => (
                      <UIComponentsRenderer
                        key={idx}
                        components={[segue]}
                        onAction={async (action, data) => {
                          await handleAction(action, data)
                        }}
                        actionLoading={actionLoading}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            disabled={loading}
            className="bg-background border-border"
          />
          <Button 
            onClick={sendMessage} 
            disabled={loading || !input.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

