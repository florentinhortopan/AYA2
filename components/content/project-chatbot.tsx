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
  // Initial log to verify component is loaded - use multiple methods to ensure visibility
  try {
    console.log('[Pills] ===== PROJECT CHATBOT COMPONENT LOADED =====')
    console.log('[Pills] showPillsFeature:', showPillsFeature)
    console.log('[Pills] Component props:', { projectId, showPillsFeature })
    // Also log without prefix to catch if filter is the issue
    console.log('PILLS DEBUG: Component loaded, showPillsFeature =', showPillsFeature)
  } catch (error) {
    console.error('Error in initial Pills log:', error)
  }
  
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<ContentProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState(projectId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  // Unified status options - same for questions and answers
  const questionStatusOptions: QuestionStatus[] = [
    'draft',
    'pending',
    'approved',
    'rejected',
    'published',
    'valid',
    'needs_review',
    'invalid'
  ]
  const answerStatusOptions: AnswerValidationStatus[] = questionStatusOptions
  // Initialize with all statuses active by default
  const [questionStatuses, setQuestionStatuses] = useState<QuestionStatus[]>(questionStatusOptions)
  const [answerStatuses, setAnswerStatuses] = useState<AnswerValidationStatus[]>(answerStatusOptions)
  const endRef = useRef<HTMLDivElement>(null)
  const projectName = projects.find((project) => project.id === selectedProjectId)?.name || 'Project'
  
  // Pills state - pills are enabled when a research is selected
  const [selectedResearchId, setSelectedResearchId] = useState<string>('')
  const pillsEnabled = !!selectedResearchId // Derived state: enabled when research is selected
  const [selectedCampaignGoalId, setSelectedCampaignGoalId] = useState<string>('')
  const [selectedUseCase, setSelectedUseCase] = useState<1 | 2 | 3>(1)
  const [availableResearches, setAvailableResearches] = useState<SeguePillResearch[]>([])
  const [availableCampaignGoals, setAvailableCampaignGoals] = useState<SegueCampaignGoal[]>([])
  const [currentPills, setCurrentPills] = useState<PillLabel[]>([])
  const [usedPillIds, setUsedPillIds] = useState<Set<string>>(new Set())
  const [pillsShownCount, setPillsShownCount] = useState(0)
  const [loadingPills, setLoadingPills] = useState(false)
  const [loadingResearches, setLoadingResearches] = useState(false)

  useEffect(() => {
    if (projectId) {
    setSelectedProjectId(projectId)
    } else if (projects.length > 0 && !selectedProjectId) {
      // Auto-select first project if no projectId provided
      setSelectedProjectId(projects[0].id)
    }
  }, [projectId, projects, selectedProjectId])

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
          content: "Ask me about this project's Q&A set and I'll respond using the latest answers.",
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
    console.log('[Pills] ===== LOAD PILLS DATA EFFECT =====')
    console.log('[Pills] Conditions:', { open, showPillsFeature })
    
    const loadPillsData = async () => {
      if (!open || !showPillsFeature) {
        console.log('[Pills] Skipping load - chatbot not open or pills feature disabled')
        setAvailableResearches([])
        setAvailableCampaignGoals([])
        setLoadingResearches(false)
        return
      }

      console.log('[Pills] ✅ Loading researches and campaign goals...')
      setLoadingResearches(true)
      try {
        // Load only researches with pills generated (intentClusters)
        const researchesResponse = await fetch('/api/segue-pills/researches?withPillsOnly=true')
        if (researchesResponse.ok) {
          const researchesData = await researchesResponse.json()
          console.log('[Pills] Loaded researches:', researchesData)
          const allResearches = researchesData.researches || researchesData.data?.researches || []
          // Double-check filtering on client side as well
          const researchesWithPills = allResearches.filter((r: any) => {
            const hasPills = r && r.intentClusters !== null && r.intentClusters !== undefined
            if (!hasPills) {
              console.warn('[Pills] Research missing intentClusters:', r.id, r.name)
            }
            return hasPills
          })
          console.log('[Pills] Researches with pills:', researchesWithPills.length, researchesWithPills.map((r: any) => ({ id: r.id, name: r.name, hasQaProject: !!r.qaProject })))
          setAvailableResearches(researchesWithPills || [])
        } else {
          const errorData = await researchesResponse.json().catch(() => ({}))
          console.error('[Pills] Failed to load researches:', errorData)
          setAvailableResearches([])
        }

        // Load campaign goals
        const goalsResponse = await fetch('/api/segue-pills/campaign-goals')
        if (goalsResponse.ok) {
          const goalsData = await goalsResponse.json()
          console.log('[Pills] Loaded campaign goals:', goalsData.goals?.length || 0)
          setAvailableCampaignGoals(goalsData.goals || [])
        } else {
          console.warn('[Pills] Failed to load campaign goals')
          setAvailableCampaignGoals([])
        }
      } catch (error) {
        console.error('[Pills] Failed to load pills data:', error)
        setAvailableResearches([])
        setAvailableCampaignGoals([])
      } finally {
        setLoadingResearches(false)
      }
    }

    loadPillsData()
  }, [open, showPillsFeature])

  // Reset pills state when research is cleared
  useEffect(() => {
    if (!selectedResearchId) {
      setSelectedCampaignGoalId('')
      setCurrentPills([])
      setUsedPillIds(new Set())
      setPillsShownCount(0)
      console.log('[Pills] Research cleared, pills state reset')
    }
  }, [selectedResearchId])

  // Auto-select linked Q&A project when research is selected
  useEffect(() => {
    if (!selectedResearchId || availableResearches.length === 0) {
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
  }, [selectedResearchId, availableResearches, selectedProjectId])

  /**
   * PILLS LOADING LOGIC
   * 
   * Flow:
   * 1. When selectedResearchId is set, fetch recommendations (pills are auto-enabled)
   * 2. API: GET /api/segue-pills/researches/{researchId}/recommendations
   * 3. Extract pills from recommendations.case{1|2|3} based on selectedUseCase
   * 4. Store valid pills in currentPills state
   * 5. Pills are then attached to assistant messages in sendMessage/handlePillClick
   * 
   * Dependencies: selectedResearchId, selectedCampaignGoalId, selectedUseCase
   */
  useEffect(() => {
    const loadPills = async () => {
      console.log('[Pills] ===== LOAD PILLS EFFECT =====')
      console.log('[Pills] Dependencies:', {
        selectedResearchId,
        selectedCampaignGoalId,
        selectedUseCase
      })
      
      if (!selectedResearchId) {
        console.log('[Pills] No research selected, clearing pills')
        setCurrentPills([])
        return
      }

      console.log('[Pills] ✅ Conditions met, loading pills...')
      console.log('[Pills] Research ID:', selectedResearchId)
      console.log('[Pills] Use Case:', selectedUseCase)
      console.log('[Pills] Campaign Goal:', selectedCampaignGoalId || 'none')
      
      setLoadingPills(true)
      try {
        const url = `/api/segue-pills/researches/${selectedResearchId}/recommendations?` +
                    `campaignGoalId=${selectedCampaignGoalId || ''}&useCase=${selectedUseCase}`
        
        console.log('[Pills] Fetching from:', url)
        const response = await fetch(url)
        const data = await response.json()
        
        if (!response.ok) {
          console.error('[Pills] ❌ API error:', data.error || 'Failed to load pills', { status: response.status })
          setCurrentPills([])
          return
        }
        
        console.log('[Pills] ✅ API response received:', {
          hasRecommendations: !!data.recommendations,
          hasPillLibrary: !!data.pillLibrary,
          responseKeys: Object.keys(data)
        })
        
        // Select pills based on use case
        const recommendations = data.recommendations
        if (!recommendations) {
          console.warn('[Pills] ❌ No recommendations found in response')
          console.warn('[Pills] Make sure pills have been generated in the Research Lab')
          setCurrentPills([])
          return
        }

        const caseRec = selectedUseCase === 1 ? recommendations.case1 :
                        selectedUseCase === 2 ? recommendations.case2 :
                        recommendations.case3
        
        if (!caseRec) {
          console.warn(`[Pills] ❌ No case ${selectedUseCase} recommendation found`)
          console.warn('[Pills] Available cases:', {
            hasCase1: !!recommendations.case1,
            hasCase2: !!recommendations.case2,
            hasCase3: !!recommendations.case3
          })
          setCurrentPills([])
          return
        }
        
        console.log('[Pills] ✅ Case recommendation found:', {
          useCase: selectedUseCase,
          pillsCount: caseRec.pills?.length,
          pills: caseRec.pills?.map((p: any) => ({ id: p.id, label: p.label, type: p.type }))
        })
        
        if (!Array.isArray(caseRec.pills)) {
          console.warn('[Pills] ❌ Invalid case recommendation structure - pills is not an array')
          console.warn('[Pills] CaseRec structure:', caseRec)
          setCurrentPills([])
          return
        }
        
        // Validate case pill structure
        const casePills = caseRec.pills.filter((p: any) => {
          const isValid = p && p.id && p.label
          if (!isValid) {
            console.warn('[Pills] ⚠️ Invalid pill structure:', p)
          }
          return isValid
        })

        // Also use the validated pill library as candidate pool for answer-level relevance selection.
        const libraryPills = Array.isArray(recommendations.pillLibrary)
          ? recommendations.pillLibrary.filter((p: any) => {
              if (!p || !p.id || !p.label) return false
              return Array.isArray(p.useCase) ? p.useCase.includes(selectedUseCase) : true
            })
          : []

        // Merge case pills + library candidates by normalized label, keeping higher-confidence entry.
        const mergedByLabel = new Map<string, PillLabel>()
        ;[...casePills, ...libraryPills].forEach((pill: any) => {
          const normalized = String(pill.label).trim().toLowerCase()
          const existing = mergedByLabel.get(normalized)
          if (!existing || (pill.confidence || 0) > (existing.confidence || 0)) {
            mergedByLabel.set(normalized, pill as PillLabel)
          }
        })
        const mergedPills = Array.from(mergedByLabel.values())

        console.log('[Pills] ✅ Candidate pills loaded:', {
          casePills: casePills.length,
          libraryPills: libraryPills.length,
          merged: mergedPills.length
        })
        console.log('[Pills] Candidate list:', mergedPills.map((p: any) => ({ id: p.id, label: p.label, type: p.type, confidence: p.confidence })))
        setCurrentPills(mergedPills)
        console.log('[Pills] ===== LOAD PILLS COMPLETE =====')
      } catch (error) {
        console.error('[Pills] ❌ Failed to load pills:', error)
        setCurrentPills([])
      } finally {
        setLoadingPills(false)
      }
    }

    loadPills()
  }, [selectedResearchId, selectedCampaignGoalId, selectedUseCase])

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

  /**
   * Determine if pills should be shown based on quality gates and confidence thresholds.
   * Uses context-aware relevancy strategy to maintain high quality throughout conversation.
   */
  const shouldShowPillsWithQualityGates = (
    availablePills: PillLabel[],
    responseData: { matchedQuestionId?: string; matchedQuestionText?: string },
    minConfidence: number = 0.4
  ): { shouldShow: boolean; filteredPills: PillLabel[]; reason: string } => {
    if (!selectedResearchId) {
      return { shouldShow: false, filteredPills: [], reason: 'no research selected' }
    }

    if (availablePills.length === 0) {
      return { shouldShow: false, filteredPills: [], reason: 'no available pills' }
    }

    // Quality Gate 1: Check if response was matched from DB (high quality)
    const isHighQualityResponse = !!(responseData.matchedQuestionId || responseData.matchedQuestionText)

    // Quality Gate 2: Filter pills by confidence threshold
    const highConfidencePills = availablePills.filter(p => (p.confidence || 0) >= minConfidence)
    const lowConfidencePills = availablePills.filter(p => (p.confidence || 0) < minConfidence)

    // Decision logic:
    // - Show pills if response is high quality (matched from DB) AND we have any pills
    // - OR if we have high confidence pills available (even with AI fallback)
    // - Don't show if only low confidence pills remain (unless response was matched)
    const hasHighConfidencePills = highConfidencePills.length > 0
    const shouldShow = isHighQualityResponse 
      ? availablePills.length > 0  // High quality response: show any available pills
      : hasHighConfidencePills     // AI fallback: only show high confidence pills

    const filteredPills = shouldShow
      ? (isHighQualityResponse ? availablePills : highConfidencePills)
      : []

    const reason = !shouldShow
      ? (isHighQualityResponse 
          ? 'no pills available (unexpected)' 
          : 'only low confidence pills available (< 0.4)')
      : isHighQualityResponse
        ? 'high quality matched response'
        : 'high confidence pills available (≥ 0.4)'

    return { shouldShow, filteredPills, reason }
  }

  /**
   * Deduplicate pills by normalized label (safety net for display).
   * Keeps the first occurrence (which should have highest confidence after sorting).
   */
  const deduplicatePillsByLabel = (pills: PillLabel[]): PillLabel[] => {
    const seenLabels = new Set<string>()
    return pills.filter(pill => {
      const normalizedLabel = pill.label.trim().toLowerCase()
      if (seenLabels.has(normalizedLabel)) {
        return false // Skip duplicate
      }
      seenLabels.add(normalizedLabel)
      return true
    })
  }

  const tokenizeText = (value: string): Set<string> => {
    return new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .map(token => token.trim())
        .filter(token => token.length > 2)
    )
  }

  const scorePillRelevance = (pill: PillLabel, contextTokens: Set<string>): number => {
    if (contextTokens.size === 0) return 0
    const pillTokens = tokenizeText(`${pill.label} ${pill.intent}`)
    if (pillTokens.size === 0) return 0

    let overlap = 0
    for (const token of pillTokens) {
      if (contextTokens.has(token)) {
        overlap += 1
      }
    }

    // Cap denominator to avoid over-penalizing longer labels/intents
    return overlap / Math.max(1, Math.min(6, pillTokens.size))
  }

  /**
   * Select a compact, relevance-first set of pills for the current answer.
   * Target behavior:
   * - Prefer 1 anticipate pill that best matches the current answer context
   * - Add up to 2 entice pills with highest relevance/confidence
   * - Only surface pills when they are relevant (or strongly confident fallback)
   */
  const selectPillsForDisplay = (
    pills: PillLabel[],
    useCase: 1 | 2 | 3,
    responseContext: { matchedQuestionText?: string; response?: string },
    maxPills: number = 3
  ): PillLabel[] => {
    if (pills.length === 0) return []

    const contextTokens = tokenizeText(
      `${responseContext.matchedQuestionText || ''} ${responseContext.response || ''}`
    )

    const scored = deduplicatePillsByLabel(pills)
      .map(pill => {
        const relevance = scorePillRelevance(pill, contextTokens)
        const confidence = pill.confidence || 0
        return {
          pill,
          relevance,
          confidence,
          score: (relevance * 0.7) + (confidence * 0.3)
        }
      })
      .sort((a, b) => b.score - a.score)

    // Relevance-first pool; allow very high-confidence fallback candidates.
    const relevancePool = scored.filter(item => item.relevance > 0 || item.confidence >= 0.75)
    const pool = relevancePool.length > 0
      ? relevancePool
      : scored.filter(item => item.confidence >= 0.55)

    if (pool.length === 0) return []

    const selected: PillLabel[] = []
    const selectedIds = new Set<string>()
    const selectedLabels = new Set<string>()
    const add = (pill: PillLabel | undefined) => {
      if (!pill) return false
      const normalized = pill.label.trim().toLowerCase()
      if (selectedIds.has(pill.id) || selectedLabels.has(normalized)) return false
      selected.push(pill)
      selectedIds.add(pill.id)
      selectedLabels.add(normalized)
      return true
    }

    const anticipateCandidates = pool.filter(item => item.pill.type === 'anticipate')
    const enticeCandidates = pool.filter(item => item.pill.type === 'entice')
    const remainingCandidates = pool
      .map(item => item.pill)
      .filter(pill => !selectedIds.has(pill.id))

    // 1) Add the best anticipate pill first if available.
    add(anticipateCandidates[0]?.pill)

    // 2) Add up to 2 entice pills.
    for (const item of enticeCandidates.slice(0, 2)) {
      if (selected.length >= maxPills) break
      add(item.pill)
    }

    // 3) If still empty (or missing slots), fill with top remaining relevant pills.
    for (const pill of remainingCandidates) {
      if (selected.length >= maxPills) break
      add(pill)
    }

    // For generic case 1, keep list compact and broad.
    if (useCase === 1) {
      return selected.slice(0, Math.min(2, maxPills))
    }

    return selected.slice(0, maxPills)
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

      // Determine if we should show pills using quality gates
      const allAvailablePills = currentPills.filter(p => p && p.id && !usedPillIds.has(p.id) && p.id !== pill.id)
      
      // Apply quality gates
      const qualityCheck = shouldShowPillsWithQualityGates(
        allAvailablePills,
        { matchedQuestionId: data.matchedQuestionId, matchedQuestionText: data.matchedQuestionText },
        0.4 // Minimum confidence threshold
      )

        // Select compact, relevance-first pills for this specific answer
      const availablePills = qualityCheck.shouldShow
        ? selectPillsForDisplay(
            qualityCheck.filteredPills,
            selectedUseCase,
            { matchedQuestionText: data.matchedQuestionText, response: data.response },
            3
          )
        : []

      console.log('[Pills] handlePillClick - pill selection:', {
        allAvailable: allAvailablePills.length,
        qualityFiltered: qualityCheck.filteredPills.length,
        selected: availablePills.length,
        selection: availablePills.map(p => ({ label: p.label, type: p.type, confidence: p.confidence })),
        anticipate: availablePills.filter(p => p.type === 'anticipate').length,
        entice: availablePills.filter(p => p.type === 'entice').length,
        cta: availablePills.filter(p => p.type === 'cta').length,
        shouldShowPills: qualityCheck.shouldShow,
        reason: qualityCheck.reason,
        isHighQualityResponse: !!(data.matchedQuestionId || data.matchedQuestionText)
      })

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
        pills: qualityCheck.shouldShow ? availablePills : undefined
      }
      
      setMessages((current) => [...current, assistantMessage])
      
      // Track pills shown for analytics (no longer used as a limit)
      if (qualityCheck.shouldShow) {
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

      // Determine if we should show pills using quality gates
      const allAvailablePills = currentPills.filter(p => p && p.id && !usedPillIds.has(p.id))
      
      // Apply quality gates
      const qualityCheck = shouldShowPillsWithQualityGates(
        allAvailablePills,
        { matchedQuestionId: data.matchedQuestionId, matchedQuestionText: data.matchedQuestionText },
        0.4 // Minimum confidence threshold
      )

      // Select compact, relevance-first pills for this specific answer
      const availablePills = qualityCheck.shouldShow
        ? selectPillsForDisplay(
            qualityCheck.filteredPills,
            selectedUseCase,
            { matchedQuestionText: data.matchedQuestionText, response: data.response },
            3
          )
        : []

      console.log('[Pills] ===== SEND MESSAGE =====')
      console.log('[Pills] Pill selection:', {
        allAvailable: allAvailablePills.length,
        qualityFiltered: qualityCheck.filteredPills.length,
        selected: availablePills.length,
        selection: availablePills.map(p => ({ label: p.label, type: p.type, confidence: p.confidence })),
        anticipate: availablePills.filter(p => p.type === 'anticipate').length,
        entice: availablePills.filter(p => p.type === 'entice').length,
        cta: availablePills.filter(p => p.type === 'cta').length,
        useCase: selectedUseCase,
        shouldShowPills: qualityCheck.shouldShow,
        reason: qualityCheck.reason,
        isHighQualityResponse: !!(data.matchedQuestionId || data.matchedQuestionText)
      })

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
        pills: qualityCheck.shouldShow ? availablePills : undefined
      }
      
      if (qualityCheck.shouldShow) {
        console.log('[Pills] ✅ Attaching pills to message:', availablePills.map(p => p.label))
        setPillsShownCount(prev => prev + 1) // Track for analytics (no longer used as limit)
      } else {
        console.log('[Pills] ❌ Not showing pills:', {
          reason: qualityCheck.reason,
          allAvailable: allAvailablePills.length,
          qualityFiltered: qualityCheck.filteredPills.length,
          isHighQualityResponse: !!(data.matchedQuestionId || data.matchedQuestionText)
        })
      }
      
      setMessages((current) => [...current, assistantMessage])
      console.log('[Pills] ===== SEND MESSAGE COMPLETE =====')
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
        <Card className="w-[360px] max-h-[90vh] shadow-xl border-border bg-card mb-3 flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Project Sandbox Assistant</p>
              <p className="text-xs text-muted-foreground">{projectName}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
          {/* Configuration Section - Scrollable with max height */}
          <div className="border-b border-border overflow-y-auto flex-shrink-0">
            <div className="px-4 py-3 space-y-3">
              {/* Project Selector - Always visible */}
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

              {/* Status Filters - Collapsible */}
              <details className="group">
                <summary className="cursor-pointer text-xs font-medium text-foreground hover:text-primary list-none flex items-center justify-between py-1.5 px-1 rounded hover:bg-muted/50 transition-colors">
                  <span>📊 Status Filters</span>
                  <span className="text-muted-foreground text-[10px] font-normal">
                    {questionStatuses.length + answerStatuses.length} active
                  </span>
                </summary>
                <div className="mt-2 space-y-3 pt-2 border-t border-border">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Question status filters</p>
              <div className="flex flex-wrap gap-1">
                {questionStatusOptions.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={questionStatuses.includes(status) ? 'default' : 'outline'}
                    onClick={() => toggleQuestionStatus(status)}
                          className="text-[10px] h-7"
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
                          className="text-[10px] h-7"
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          </div>
              </details>
            
              {/* Segue Pills Configuration - Collapsible, only show if showPillsFeature is true */}
              {showPillsFeature && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium text-foreground hover:text-primary list-none flex items-center justify-between py-1.5 px-1 rounded hover:bg-muted/50 transition-colors">
                    <span>💊 Segue Pills</span>
                    <span className="text-muted-foreground text-[10px] font-normal">
                      {selectedResearchId ? 'Active' : 'Inactive'}
                    </span>
                  </summary>
                  <div className="mt-2 space-y-3 pt-2 border-t border-border">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">Segue Pills Research Project</p>
                  <Select 
                    value={selectedResearchId || undefined} 
                    onValueChange={(value) => {
                      try {
                        console.log('[Pills] ===== RESEARCH SELECTED =====')
                        console.log('[Pills] Selected value:', value)
                        
                        if (!value || value === '__none__') {
                          console.log('[Pills] Clearing research selection')
                          setSelectedResearchId('')
                          setCurrentPills([])
                          return
                        }
                        
                        setSelectedResearchId(value)
                        console.log('[Pills] ✅ Research selected:', value)
                        
                        // Show which Q&A project is linked
                        const selectedResearch = availableResearches.find(r => r.id === value)
                        if (selectedResearch) {
                          const researchData = selectedResearch as any
                          if (researchData.qaProject) {
                            console.log('[Pills] Research linked to Q&A project:', researchData.qaProject.name)
                          }
                        }
                      } catch (error) {
                        console.error('[Pills] ❌ Error selecting research:', error)
                        setSelectedResearchId('')
                      }
                    }}
                    disabled={loadingPills || loadingResearches || !Array.isArray(availableResearches) || availableResearches.length === 0}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={loadingResearches ? "Loading..." : "Select research project..."} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None (disable pills)</SelectItem>
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
                      ) : null}
                    </SelectContent>
                  </Select>
                  
                  {/* Status messages */}
                  <div className="space-y-1">
                    {loadingResearches && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        ⏳ Loading research projects...
                      </p>
                    )}
                    
                    {!loadingResearches && (!Array.isArray(availableResearches) || availableResearches.length === 0) && (
                      <div className="space-y-1">
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          ⚠️ No research projects with pills available
                        </p>
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground">How to create pills</summary>
                          <ol className="ml-4 mt-1 list-decimal space-y-0.5">
                            <li>Go to the Research Lab</li>
                            <li>Generate questions and cluster intents</li>
                            <li>Generate pill recommendations</li>
                            <li>Return here to test them</li>
                          </ol>
                        </details>
                      </div>
                    )}
                    
                    {!loadingResearches && Array.isArray(availableResearches) && availableResearches.length > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✅ {availableResearches.length} research project{availableResearches.length !== 1 ? 's' : ''} available
                      </p>
                    )}
                    
                    {selectedResearchId && (() => {
                      const selectedResearch = availableResearches.find(r => r.id === selectedResearchId)
                      const researchData = selectedResearch as any
                      if (researchData?.qaProject) {
                        return (
                          <p className="text-xs text-muted-foreground">
                            Linked to Q&A project: <span className="font-semibold">{researchData.qaProject.name}</span>
                          </p>
                        )
                      }
                      return null
                    })()}
                  </div>
                </div>
              
              {selectedResearchId && Array.isArray(availableResearches) && (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Campaign Goal (optional)</p>
                    <Select 
                      value={selectedCampaignGoalId || '__none__'} 
                      onValueChange={(value) => {
                        try {
                          if (value === '__none__') {
                            setSelectedCampaignGoalId('')
                          } else {
                            setSelectedCampaignGoalId(value)
                          }
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
                        <SelectItem value="__none__">None</SelectItem>
                        {availableCampaignGoals && availableCampaignGoals.length > 0 ? (
                          availableCampaignGoals.map((goal) => (
                            <SelectItem key={goal.id} value={goal.id}>
                              {goal.name}
                            </SelectItem>
                          ))
                        ) : null}
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
                  
                  {/* Pills Status */}
                  <div className="space-y-1">
                    {loadingPills && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        ⏳ Loading pills...
                      </p>
                    )}
                    {!loadingPills && selectedResearchId && currentPills.length === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ No pills loaded. Check console for errors.
                      </p>
                    )}
                    {!loadingPills && selectedResearchId && currentPills.length > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ✅ {currentPills.length} pill{currentPills.length !== 1 ? 's' : ''} ready
                      </p>
                    )}
                  </div>
                  
                  {/* Debug Panel - Collapsible, collapsed by default */}
                  {showPillsFeature && (
                    <details className="text-xs border-2 border-blue-500/50 rounded p-2 bg-blue-500/10">
                      <summary className="cursor-pointer font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                        🔍 Debug Info (Click to expand) | Console: Filter by &quot;[Pills]&quot;
                      </summary>
                      <div className="mt-2 space-y-1 font-mono text-[10px]">
                        <div className="text-xs text-muted-foreground mb-2 font-sans">
                          💡 Tip: Open browser console (F12 or Cmd+Option+J) and filter by &quot;[Pills]&quot; to see detailed logs
                        </div>
                        <div className="mb-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-6"
                            onClick={() => {
                              console.log('[Pills] ===== MANUAL TEST LOG =====')
                              console.log('[Pills] This is a test log to verify console is working')
                              console.log('[Pills] Current state:', {
                                selectedResearchId,
                                pillsEnabled: !!selectedResearchId,
                                availableResearches: availableResearches.length,
                                currentPills: currentPills.length,
                                showPillsFeature
                              })
                              console.log('[Pills] ===== TEST LOG COMPLETE =====')
                              alert('Test log sent! Check console and filter by "[Pills]"')
                            }}
                          >
                            🧪 Test Console Log
                          </Button>
                        </div>
                        <div>Enabled: {!!selectedResearchId ? '✅' : '❌'}</div>
                        <div>Research ID: {selectedResearchId || 'none'}</div>
                        <div>Campaign Goal: {selectedCampaignGoalId || 'none'}</div>
                        <div>Use Case: {selectedUseCase}</div>
                        <div>Available Researches: {availableResearches.length}</div>
                        <div>Current Pills: {currentPills.length}</div>
                        <div>Pills Shown (analytics): {pillsShownCount}</div>
                        <div>Used Pills: {usedPillIds.size}</div>
                        <div>Loading Pills: {loadingPills ? '⏳' : '✅'}</div>
                        <div>Loading Researches: {loadingResearches ? '⏳' : '✅'}</div>
                        {selectedResearchId && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <div className="font-semibold">Selected Research:</div>
                            {(() => {
                              const research = availableResearches.find(r => r.id === selectedResearchId)
                              if (research) {
                                const researchData = research as any
                                return (
                                  <>
                                    <div>Name: {research.name}</div>
                                    <div>Status: {research.status}</div>
                                    <div>Q&A Project: {researchData.qaProject?.name || 'none'}</div>
                                    <div>Has Intent Clusters: {researchData.intentClusters ? '✅' : '❌'}</div>
                                    <div>Has Recommendations: {researchData.recommendations ? '✅' : '❌'}</div>
                                  </>
                                )
                              }
                              return <div>Research not found</div>
                            })()}
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </>
              )}
                  </div>
                </details>
              )}
            </div>
          </div>
          
          {/* Chat Messages Area - Flexible height with scroll */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
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
          {/* Input Area - Fixed at bottom */}
          <div className="border-t border-border px-4 py-3 flex gap-2 flex-shrink-0 bg-card">
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
