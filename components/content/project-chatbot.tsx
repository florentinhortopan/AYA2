'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AnswerValidationStatus, ContentProject, QuestionStatus } from '@/types/content'
import type { PillLabel } from '@/lib/segue-pills/pill-recommender'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  pills?: PillLabel[] // Pills shown after this message
}

interface ProjectChatbotProps {
  projectId: string
}

interface SeguePillResearch {
  id: string
  name: string
  status: string
}

interface SegueCampaignGoal {
  id: string
  name: string
  goalType: string
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
  
  // Pills state
  const [pillsEnabled, setPillsEnabled] = useState(false)
  const [selectedResearchId, setSelectedResearchId] = useState<string>('')
  const [selectedCampaignGoalId, setSelectedCampaignGoalId] = useState<string>('')
  const [selectedUseCase, setSelectedUseCase] = useState<1 | 2 | 3>(1)
  const [availableResearches, setAvailableResearches] = useState<SeguePillResearch[]>([])
  const [availableCampaignGoals, setAvailableCampaignGoals] = useState<SegueCampaignGoal[]>([])
  const [currentPills, setCurrentPills] = useState<PillLabel[]>([])
  const [usedPillIds, setUsedPillIds] = useState<Set<string>>(new Set())
  const [pillsShownCount, setPillsShownCount] = useState(0)
  const [loadingPills, setLoadingPills] = useState(false)
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
          content: 'Ask me about this project&apos;s Q&A set and I&apos;ll respond using the latest answers.',
          timestamp: new Date().toISOString()
        }
      ])
    }
  }, [messages.length])

  // Reset pills state when chatbot is closed
  useEffect(() => {
    if (!open) {
      setUsedPillIds(new Set())
      setPillsShownCount(0)
    }
  }, [open])

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

  // Load available researches and campaign goals
  useEffect(() => {
    const loadPillsData = async () => {
      if (!open) return

      try {
        // Load researches
        const researchesResponse = await fetch('/api/segue-pills/researches')
        if (researchesResponse.ok) {
          const researchesData = await researchesResponse.json()
          setAvailableResearches(researchesData.researches || [])
        }

        // Load campaign goals
        const goalsResponse = await fetch('/api/segue-pills/campaign-goals')
        if (goalsResponse.ok) {
          const goalsData = await goalsResponse.json()
          setAvailableCampaignGoals(goalsData.goals || [])
        }
      } catch (error) {
        console.error('Failed to load pills data:', error)
      }
    }

    loadPillsData()
  }, [open])

  // Load pills when configuration changes
  useEffect(() => {
    const loadPills = async () => {
      if (!pillsEnabled || !selectedResearchId) {
        setCurrentPills([])
        return
      }

      setLoadingPills(true)
      try {
        const url = `/api/segue-pills/researches/${selectedResearchId}/recommendations?` +
                    `campaignGoalId=${selectedCampaignGoalId || ''}&useCase=${selectedUseCase}`
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to load pills')
        }
        
        const data = await response.json()
        
        // Select pills based on use case
        const recommendations = data.recommendations
        if (!recommendations) {
          setCurrentPills([])
          return
        }

        const caseRec = selectedUseCase === 1 ? recommendations.case1 :
                        selectedUseCase === 2 ? recommendations.case2 :
                        recommendations.case3
        
        setCurrentPills(caseRec?.pills || [])
      } catch (error) {
        console.error('Failed to load pills:', error)
        setCurrentPills([])
      } finally {
        setLoadingPills(false)
      }
    }

    loadPills()
  }, [pillsEnabled, selectedResearchId, selectedCampaignGoalId, selectedUseCase])

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

  const handlePillClick = async (pill: PillLabel) => {
    // Mark pill as used
    setUsedPillIds(prev => new Set([...prev, pill.id]))
    
    // Send pill label as user message
    setInput(pill.label)
    
    // Trigger sendMessage with pill label
    const userMessage: ChatMessage = {
      role: 'user',
      content: pill.label,
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
          message: pill.label,
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

      // Determine if we should show pills
      const shouldShowPills = pillsEnabled && 
                              pillsShownCount < 3 && 
                              currentPills.length > 0

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
        timestamp: new Date().toISOString(),
        pills: shouldShowPills ? currentPills.filter(p => !usedPillIds.has(p.id) && p.id !== pill.id) : undefined
      }
      
      setMessages((current) => [...current, assistantMessage])
      
      if (shouldShowPills) {
        setPillsShownCount(prev => prev + 1)
      }
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

      // Determine if we should show pills (first 3 assistant messages, pills enabled)
      const shouldShowPills = pillsEnabled && 
                              pillsShownCount < 3 && 
                              currentPills.length > 0

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
        timestamp: new Date().toISOString(),
        pills: shouldShowPills ? currentPills.filter(p => !usedPillIds.has(p.id)) : undefined
      }
      
      setMessages((current) => [...current, assistantMessage])
      
      if (shouldShowPills) {
        setPillsShownCount(prev => prev + 1)
      }
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
            
            {/* Segue Pills Configuration */}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enable-pills"
                  checked={pillsEnabled}
                  onChange={(e) => setPillsEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="enable-pills" className="text-xs text-muted-foreground cursor-pointer">
                  Enable Segue Pills
                </label>
              </div>
              
              {pillsEnabled && (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Research Project</p>
                    <Select 
                      value={selectedResearchId} 
                      onValueChange={setSelectedResearchId}
                      disabled={loadingPills}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select research..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableResearches.map((research) => (
                          <SelectItem key={research.id} value={research.id}>
                            {research.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Campaign Goal (optional)</p>
                    <Select 
                      value={selectedCampaignGoalId} 
                      onValueChange={setSelectedCampaignGoalId}
                      disabled={loadingPills}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {availableCampaignGoals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            {goal.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Simulate Use Case</p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={selectedUseCase === 1 ? 'default' : 'outline'}
                        onClick={() => setSelectedUseCase(1)}
                        className="text-xs"
                      >
                        Case 1
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedUseCase === 2 ? 'default' : 'outline'}
                        onClick={() => setSelectedUseCase(2)}
                        className="text-xs"
                      >
                        Case 2
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedUseCase === 3 ? 'default' : 'outline'}
                        onClick={() => setSelectedUseCase(3)}
                        className="text-xs"
                      >
                        Case 3
                      </Button>
                    </div>
                  </div>
                  
                  {loadingPills && (
                    <p className="text-xs text-muted-foreground">Loading pills...</p>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="max-h-[360px] overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.timestamp}-${index}`}
                className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
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
                
                {/* Show pills below assistant messages */}
                {message.role === 'assistant' && message.pills && message.pills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                    {message.pills.map((pill) => {
                      const pillVariants = {
                        anticipate: 'outline',
                        entice: 'secondary',
                        cta: 'default'
                      } as const
                      
                      return (
                        <Button
                          key={pill.id}
                          size="sm"
                          variant={pillVariants[pill.type] || 'outline'}
                          className="text-xs h-7"
                          onClick={() => handlePillClick(pill)}
                          disabled={loading}
                        >
                          {pill.label}
                        </Button>
                      )
                    })}
                  </div>
                )}
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
