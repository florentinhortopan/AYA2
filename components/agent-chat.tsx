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
  metadata?: RichAgentResponse['metadata'] & {
    sourceCount?: number
    retrievedSourceCount?: number
    generatedAt?: string
  }
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
  const [openCoverageMessageIndex, setOpenCoverageMessageIndex] = useState<number | null>(null)
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
        segues: data.segues || [],
        metadata: data.metadata
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

  const formatTimeLabel = (isoTimestamp?: string): string => {
    if (!isoTimestamp) return ''
    try {
      return new Date(isoTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <Card className={`w-full max-w-3xl mx-auto border-[#d9d0bc] bg-[#f3efe3] ${containerClassName || ''}`.trim()}>
      {!hideHeader && (
        <CardHeader className="border-b border-[#ddd5c0] pb-3">
          <CardTitle className="text-xl text-[#1f1f1f] font-semibold">{titleOverride || agentNames[agentType]}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className={`${messagesHeightClassName || 'h-96'} overflow-y-auto space-y-4 p-4 bg-[#efe8d5] rounded-lg border border-[#ddd5c0]`}>
          {messages.length > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-[#6a6558]">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#2f3a2f] text-[#f3efe3]">★</span>
              <span>Chat started at {formatTimeLabel(messages[0]?.timestamp)}</span>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-[#2f3a2f] text-[#f5f2e9] rounded-[22px] rounded-br-md'
                    : 'bg-[#e7dfc8] border border-[#ddd5c0] text-[#2a2a2a] rounded-[22px] rounded-bl-md'
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
                  <div className="mt-4 pt-4 border-t border-[#d9d0bc] space-y-2">
                    <p className="text-xs text-[#6a6558] mb-2">You might also want to:</p>
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
                {msg.role === 'assistant' && msg.metadata?.sourceCount && (
                  <div className="mt-3 relative">
                    <button
                      type="button"
                      className="text-xs text-[#6a6558] underline underline-offset-2 hover:text-[#2a2a2a] transition-colors"
                      onClick={() =>
                        setOpenCoverageMessageIndex((current) => (current === idx ? null : idx))
                      }
                    >
                      Source coverage
                    </button>
                    {openCoverageMessageIndex === idx && (
                      <div className="absolute right-0 mt-2 z-20 w-72 rounded-md border border-[#ddd5c0] bg-[#fbf8ef] p-3 shadow-lg text-xs text-[#2a2a2a] space-y-1">
                        <p><span className="font-medium">Indexed pages:</span> {String(msg.metadata.sourceCount)}</p>
                        <p><span className="font-medium">Retrieved now:</span> {String(msg.metadata.retrievedSourceCount || 0)}</p>
                        <p><span className="font-medium">Dataset generated:</span> {String(msg.metadata.generatedAt || 'unknown')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#e7dfc8] border border-[#ddd5c0] rounded-[22px] rounded-bl-md p-3">
                <p className="text-sm text-[#6a6558]">Thinking...</p>
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
            className="bg-[#fbf8ef] border-[#d7ceb8]"
          />
          <Button 
            onClick={sendMessage} 
            disabled={loading || !input.trim()}
            className="bg-[#2f3a2f] text-[#f5f2e9] hover:bg-[#263126]"
          >
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

