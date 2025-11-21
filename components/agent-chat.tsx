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
}

interface AgentChatProps {
  agentType: AgentType
  userId?: string
}

export function AgentChat({ agentType, userId }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
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
      fetch(`/api/agents/${agentType}`)
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

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch(`/api/agents/${agentType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
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
        components: data.components || []
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

  const agentNames: Record<AgentType, string> = {
    recruitment: 'Recruitment Assistant',
    training: 'Training Assistant',
    financial: 'Financial Assistant',
    educational: 'Educational Assistant'
  }

  return (
    <Card className="w-full max-w-3xl mx-auto border-border bg-card">
      <CardHeader>
        <CardTitle className="text-2xl text-gold font-bold">{agentNames[agentType]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-96 overflow-y-auto space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
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
                    onAction={(action, data) => {
                      // Handle action buttons
                      console.log('Action triggered:', action, data)
                      // You can implement specific action handlers here
                      // For example: navigate to a page, save data, etc.
                    }}
                  />
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

