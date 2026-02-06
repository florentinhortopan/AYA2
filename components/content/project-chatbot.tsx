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
  projectId?: string
  showPillsFeature?: boolean // Only show pills feature in segue pills lab
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

export function ProjectChatbot({ projectId = '', showPillsFeature = false }: ProjectChatbotProps) {
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
  const [loadingResearches, setLoadingResearches] = useState(false)
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
    if (projectId) {
      setSelectedProjectId(projectId)
    } else if (projects.length > 0 && !selectedProjectId) {
      // Auto-select first project if no projectId provided
      setSelectedProjectId(projects[0].id)
    }
  }, [projectId, projects])

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

  // Load available researches and campaign goals (only if pills feature is enabled)
  useEffect(() => {
    const loadPillsData = async () => {
      if (!open || !showPillsFeature) {
        setAvailableResearches([])
        setAvailableCampaignGoals([])
        setLoadingResearches(false)
        return
      }

      setLoadingResearches(true)
      try {
        // Load all researches - filter client-side to only those with intentClusters (pills generated)
        const researchesResponse = await fetch('/api/segue-pills/researches')
        if (researchesResponse.ok) {
          const researchesData = await researchesResponse.json()
          console.log('Loaded researches:', researchesData)
          // Filter to only researches that have intentClusters (pills generated)
          const allResearches = researchesData.researches || researchesData.data?.researches || []
          const researchesWithPills = allResearches.filter((r: any) => 
            r && r.intentClusters !== null && r.intentClusters !== undefined
          )
          console.log('Researches with pills:', researchesWithPills.length)
          setAvailableResearches(researchesWithPills || [])
        } else {
          const errorData = await researchesResponse.json().catch(() => ({}))
          console.error('Failed to load researches:', errorData)
          setAvailableResearches([])
        }

        // Load campaign goals
        const goalsResponse = await fetch('/api/segue-pills/campaign-goals')
        if (goalsResponse.ok) {
          const goalsData = await goalsResponse.json()
          setAvailableCampaignGoals(goalsData.goals || [])
        } else {
          setAvailableCampaignGoals([])
        }
      } catch (error) {
        console.error('Failed to load pills data:', error)
        setAvailableResearches([])
        setAvailableCampaignGoals([])
      } finally {
        setLoadingResearches(false)
      }
    }

    loadPillsData()
  }, [open, showPillsFeature])

  // Auto-select linked Q&A project when research is selected
  useEffect(() => {
    if (!pillsEnabled || !selectedResearchId || availableResearches.length === 0) {
      return
    }

    try {
      const selectedResearch = availableResearches.find(r => r.id === selectedResearchId)
      if (selectedResearch) {
        const researchData = selectedResearch as any
        if (researchData.qaProject && researchData.qaProject.id) {
          const linkedProjectId = researchData.qaProject.id
          // Only update if different from current selection
          if (linkedProjectId && linkedProjectId !== selectedProjectId) {
            console.log('Auto-selecting linked Q&A project:', linkedProjectId)
            setSelectedProjectId(linkedProjectId)
          }
        } else {
          console.warn('Selected research has no linked Q&A project:', selectedResearchId)
        }
      }
    } catch (error) {
      console.error('Error auto-selecting Q&A project:', error)
    }
  }, [selectedResearchId, availableResearches, pillsEnabled, selectedProjectId])

  // Load pills when configuration changes
  useEffect(() => {
    const loadPills = async () => {
      if (!pillsEnabled) {
        setCurrentPills([])
        return
      }
      
      if (!selectedResearchId) {
        // Don't load pills if no research is selected
        setCurrentPills([])
        return
      }

      setLoadingPills(true)
      try {
        const url = `/api/segue-pills/researches/${selectedResearchId}/recommendations?` +
                    `campaignGoalId=${selectedCampaignGoalId || ''}&useCase=${selectedUseCase}`
        
        const response = await fetch(url)
        const data = await response.json()
        
        if (!response.ok) {
          console.error('API error:', data.error || 'Failed to load pills')
          setCurrentPills([])
          return
        }
        
        // Select pills based on use case
        const recommendations = data.recommendations
        if (!recommendations) {
          console.warn('No recommendations found in response. Make sure pills have been generated in the Research Lab.')
          setCurrentPills([])
          return
        }

        const caseRec = selectedUseCase === 1 ? recommendations.case1 :
                        selectedUseCase === 2 ? recommendations.case2 :
                        recommendations.case3
        
        if (!caseRec) {
          console.warn(`No case ${selectedUseCase} recommendation found`)
          setCurrentPills([])
          return
        }
        
        if (!Array.isArray(caseRec.pills)) {
          console.warn('Invalid case recommendation structure - pills is not an array:', caseRec)
          setCurrentPills([])
          return
        }
        
        // Validate pill structure
        const validPills = caseRec.pills.filter((p: any) => p && p.id && p.label)
        setCurrentPills(validPills)
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
                              Array.isArray(currentPills) && 
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
        pills: shouldShowPills ? currentPills.filter(p => p && p.id && !usedPillIds.has(p.id) && p.id !== pill.id) : undefined
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
                              Array.isArray(currentPills) && 
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
        pills: shouldShowPills ? currentPills.filter(p => p && p.id && !usedPillIds.has(p.id)) : undefined
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
            
            {/* Segue Pills Configuration - Only show if showPillsFeature is true */}
            {showPillsFeature && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enable-pills"
                      checked={pillsEnabled}
                      onChange={(e) => {
                        try {
                          const newValue = e.target.checked
                          if (newValue && (!Array.isArray(availableResearches) || availableResearches.length === 0)) {
                            alert('No research projects with generated pills available. Please generate pills in the Research Lab first.')
                            return
                          }
                          setPillsEnabled(newValue)
                        } catch (error) {
                          console.error('Error enabling pills:', error)
                          setPillsEnabled(false)
                        }
                      }}
                      className="h-4 w-4"
                      disabled={loadingResearches || !Array.isArray(availableResearches) || availableResearches.length === 0}
                    />
                    <label htmlFor="enable-pills" className="text-xs text-foreground cursor-pointer">
                      Enable Segue Pills
                    </label>
                  </div>
                  
                  {/* Status message */}
                  {loadingResearches && (
                    <p className="text-xs text-muted-foreground ml-6">Loading research projects...</p>
                  )}
                  {!loadingResearches && (!Array.isArray(availableResearches) || availableResearches.length === 0) && (
                    <div className="ml-6 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        No research projects with pills available.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        To enable pills:
                      </p>
                      <ol className="text-xs text-muted-foreground ml-4 list-decimal">
                        <li>Go to the Research Lab</li>
                        <li>Generate questions and cluster intents</li>
                        <li>Generate pill recommendations</li>
                        <li>Return here to test them</li>
                      </ol>
                    </div>
                  )}
                  {!loadingResearches && Array.isArray(availableResearches) && availableResearches.length > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 ml-6">
                      ✓ {availableResearches.length} research project{availableResearches.length !== 1 ? 's' : ''} with pills available
                    </p>
                  )}
                </div>
              
              {pillsEnabled && Array.isArray(availableResearches) && (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Research Project</p>
                    <Select 
                      value={selectedResearchId || ''} 
                      onValueChange={(value) => {
                        try {
                          if (!value) {
                            setSelectedResearchId('')
                            setCurrentPills([])
                            return
                          }
                          setSelectedResearchId(value)
                          
                          // Show which Q&A project is linked
                          const selectedResearch = availableResearches.find(r => r.id === value)
                          if (selectedResearch) {
                            const researchData = selectedResearch as any
                            if (researchData.qaProject) {
                              console.log('Research linked to Q&A project:', researchData.qaProject.name)
                            }
                          }
                        } catch (error) {
                          console.error('Error selecting research:', error)
                          setSelectedResearchId('')
                        }
                      }}
                      disabled={loadingPills || !Array.isArray(availableResearches) || availableResearches.length === 0}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select research..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableResearches && availableResearches.length > 0 ? (
                          availableResearches.map((research) => {
                            const researchData = research as any
                            const linkedProject = researchData.qaProject?.name || 'No Q&A project'
                            return (
                              <SelectItem key={research.id} value={research.id}>
                                {research.name} ({linkedProject})
                              </SelectItem>
                            )
                          })
                        ) : (
                          <SelectItem value="" disabled>No researches available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedResearchId && (() => {
                      const selectedResearch = availableResearches.find(r => r.id === selectedResearchId)
                      const researchData = selectedResearch as any
                      if (researchData?.qaProject) {
                        return (
                          <p className="text-xs text-muted-foreground mt-1">
                            Linked to Q&A project: <span className="font-semibold">{researchData.qaProject.name}</span>
                          </p>
                        )
                      }
                      return null
                    })()}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Campaign Goal (optional)</p>
                    <Select 
                      value={selectedCampaignGoalId || ''} 
                      onValueChange={(value) => {
                        try {
                          setSelectedCampaignGoalId(value)
                        } catch (error) {
                          console.error('Error selecting campaign goal:', error)
                        }
                      }}
                      disabled={loadingPills}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {availableCampaignGoals && availableCampaignGoals.length > 0 ? (
                          availableCampaignGoals.map((goal) => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {goal.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No goals available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Simulate Use Case</p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={selectedUseCase === 1 ? 'default' : 'outline'}
                        onClick={() => {
                          try {
                            setSelectedUseCase(1)
                          } catch (error) {
                            console.error('Error setting use case:', error)
                          }
                        }}
                        className="text-xs"
                      >
                        Case 1
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedUseCase === 2 ? 'default' : 'outline'}
                        onClick={() => {
                          try {
                            setSelectedUseCase(2)
                          } catch (error) {
                            console.error('Error setting use case:', error)
                          }
                        }}
                        className="text-xs"
                      >
                        Case 2
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedUseCase === 3 ? 'default' : 'outline'}
                        onClick={() => {
                          try {
                            setSelectedUseCase(3)
                          } catch (error) {
                            console.error('Error setting use case:', error)
                          }
                        }}
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
            )}
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
                {message.role === 'assistant' && message.pills && Array.isArray(message.pills) && message.pills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                    {message.pills.map((pill) => {
                      if (!pill || !pill.id || !pill.label) {
                        return null
                      }
                      
                      const pillVariants = {
                        anticipate: 'outline',
                        entice: 'secondary',
                        cta: 'default'
                      } as const
                      
                      return (
                        <Button
                          key={pill.id}
                          size="sm"
                          variant={pillVariants[pill.type as keyof typeof pillVariants] || 'outline'}
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
