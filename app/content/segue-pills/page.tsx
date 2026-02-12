'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

type ResearchPhase = 'setup' | 'generating' | 'clustering' | 'recommendations' | 'complete'

interface SyntheticQuestion {
  id: string
  question: string
  intent: string
  persona: string
  context: string
  confidence: number
}

interface IntentCluster {
  intent: string
  description: string
  questionIds: string[]
  questions: string[]
  frequency: number
  pillCandidates: string[]
}

interface PillRecommendations {
  case1: any
  case2: any
  case3: any
  pillLibrary: any[]
}

type LibraryUpdateMode = 'append' | 'replace'

function SeguePillsResearchLabContent() {
  const searchParams = useSearchParams()
  const researchIdParam = searchParams.get('researchId')
  
  const [phase, setPhase] = useState<ResearchPhase>('setup')
  const [isLoading, setIsLoading] = useState(false)
  
  // Setup parameters
  const [projectName, setProjectName] = useState('')
  const [sourceType, setSourceType] = useState<'synthetic' | 'import'>('synthetic')
  const [questionCount, setQuestionCount] = useState(100)
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['high_school', 'career_changer'])
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['eligibility', 'careers', 'benefits'])
  const [availableProjects, setAvailableProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [campaignGoals, setCampaignGoals] = useState<any[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState<string>('')
  
  // Generated data
  const [questions, setQuestions] = useState<SyntheticQuestion[]>([])
  const [intentClusters, setIntentClusters] = useState<IntentCluster[]>([])
  const [recommendations, setRecommendations] = useState<PillRecommendations | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [savedResearchId, setSavedResearchId] = useState<string | null>(null)
  const [loadingExistingResearch, setLoadingExistingResearch] = useState(false)
  const [researchStatus, setResearchStatus] = useState<string>('draft')
  const [libraryUpdateMode, setLibraryUpdateMode] = useState<LibraryUpdateMode>('append')
  const [baseLibraryPills, setBaseLibraryPills] = useState<any[]>([])
  const [editingPillId, setEditingPillId] = useState<string | null>(null)
  const [editingPillLabel, setEditingPillLabel] = useState<string>('')

  const personas = [
    { id: 'high_school', label: 'High School Student' },
    { id: 'career_changer', label: 'Career Changer' },
    { id: 'veteran_family', label: 'Veteran Family Member' },
    { id: 'college_student', label: 'College Student' },
  ]

  const topics = [
    { id: 'eligibility', label: 'Eligibility & Requirements' },
    { id: 'careers', label: 'Career Exploration & MOS' },
    { id: 'benefits', label: 'Benefits & Compensation' },
    { id: 'training', label: 'Training & Education' },
    { id: 'join_process', label: 'Joining Process & Next Steps' },
  ]

  const normalizePillLabel = (label: string): string => String(label || '').trim().toLowerCase()

  const mergePillLibraries = (existingPills: any[], newPills: any[]): any[] => {
    const mergedByLabel = new Map<string, any>()
    const upsert = (pill: any) => {
      if (!pill?.id || !pill?.label) return
      const key = normalizePillLabel(pill.label)
      const current = mergedByLabel.get(key)
      if (!current) {
        mergedByLabel.set(key, { ...pill })
        return
      }

      const currentConfidence = Number(current.confidence || 0)
      const nextConfidence = Number(pill.confidence || 0)
      const winner = nextConfidence > currentConfidence ? pill : current
      const useCase = Array.from(new Set([...(Array.isArray(current.useCase) ? current.useCase : []), ...(Array.isArray(pill.useCase) ? pill.useCase : [])]))

      mergedByLabel.set(key, {
        ...(winner || {}),
        useCase
      })
    }

    existingPills.forEach(upsert)
    newPills.forEach(upsert)
    return Array.from(mergedByLabel.values())
  }

  const invalidateDownstreamForSetupChange = (reason: string) => {
    const hasGeneratedArtifacts = questions.length > 0 || intentClusters.length > 0 || !!recommendations
    if (!hasGeneratedArtifacts) return

    setError(null)
    setQuestions([])
    setIntentClusters([])
    setRecommendations(null)
    setPhase('setup')
    setResearchStatus('draft')
    setNotice(`Setup updated (${reason}). Regenerate questions and recommendations. Existing library (${baseLibraryPills.length} pills) will be ${libraryUpdateMode === 'append' ? 'kept and extended' : 'replaced'} on next run.`)
  }

  const togglePersona = (personaId: string) => {
    invalidateDownstreamForSetupChange('persona changed')
    setSelectedPersonas(prev =>
      prev.includes(personaId)
        ? prev.filter(p => p !== personaId)
        : [...prev, personaId]
    )
  }

  const toggleTopic = (topicId: string) => {
    invalidateDownstreamForSetupChange('topic changed')
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(t => t !== topicId)
        : [...prev, topicId]
    )
  }

  // Load existing research if researchId is provided
  useEffect(() => {
    const loadExistingResearch = async () => {
      if (!researchIdParam) return

      setLoadingExistingResearch(true)
      try {
        const response = await fetch(`/api/segue-pills/researches/${researchIdParam}`)
        if (response.ok) {
          const data = await response.json()
          const research = data.research || data
          
          // Load research data
          setProjectName(research.name || '')
          setSelectedProjectId(research.qaProjectId || '')
          setSelectedGoalId(research.campaignGoalId || '')
          setSelectedPersonas(research.personas || [])
          setSelectedTopics(research.topics || [])
          setQuestionCount(research.questionCount || 100)
          setSavedResearchId(research.id)
          setResearchStatus(research.status || 'draft')
          
          // Load generated data
          if (research.syntheticQuestions) {
            setQuestions(Array.isArray(research.syntheticQuestions) ? research.syntheticQuestions : [])
          }
          if (research.intentClusters) {
            setIntentClusters(Array.isArray(research.intentClusters) ? research.intentClusters : [])
            setPhase('recommendations')
          }
          if (research.recommendations) {
            const library = Array.isArray(research.recommendations?.pillLibrary)
              ? research.recommendations.pillLibrary
              : (Array.isArray(research.pillLibrary) ? research.pillLibrary : [])
            setBaseLibraryPills(library)
            setRecommendations({
              ...research.recommendations,
              pillLibrary: library
            })
            setPhase('complete')
          } else if (research.intentClusters) {
            const library = Array.isArray(research.pillLibrary) ? research.pillLibrary : []
            setBaseLibraryPills(library)
            setPhase('recommendations')
          } else if (research.syntheticQuestions) {
            const library = Array.isArray(research.pillLibrary) ? research.pillLibrary : []
            setBaseLibraryPills(library)
            setPhase('clustering')
          }
        }
      } catch (err) {
        console.error('Error loading existing research:', err)
        setError('Failed to load research project')
      } finally {
        setLoadingExistingResearch(false)
      }
    }

    loadExistingResearch()
  }, [researchIdParam])

  // Load available projects and campaign goals on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load projects
        const projectsRes = await fetch('/api/segue-pills/projects')
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          const projects = projectsData.projects || projectsData.data?.projects || []
          setAvailableProjects(projects)
          console.log('Loaded Q&A projects:', projects.length)
        } else {
          const errorData = await projectsRes.json().catch(() => ({}))
          console.error('Failed to load projects:', errorData)
          setAvailableProjects([])
        }

        // Load campaign goals
        const goalsRes = await fetch('/api/segue-pills/campaign-goals')
        if (goalsRes.ok) {
          const goalsData = await goalsRes.json()
          setCampaignGoals(goalsData.goals || goalsData.data?.goals || [])
        } else {
          setCampaignGoals([])
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setAvailableProjects([])
        setCampaignGoals([])
      }
    }
    loadData()
  }, [])

  const generateQuestions = async () => {
    // Validation
    if (sourceType === 'synthetic' && (selectedPersonas.length === 0 || selectedTopics.length === 0)) {
      setError('Please select at least one persona and one topic')
      return
    }

    if (!selectedProjectId) {
      setError('Please select a Q&A project to link this research to')
      return
    }
    if (sourceType === 'import' && !selectedProjectId) {
      setError('Please select a project to import questions from')
      return
    }

    setIsLoading(true)
    setError(null)
    setPhase('generating')

    try {
      let questionsData

      if (sourceType === 'import') {
        // Import questions from existing project
        const response = await fetch('/api/segue-pills/import-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId: selectedProjectId })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Server error: ${response.status}`)
        }

        questionsData = await response.json()
      } else {
        // Generate synthetic questions
        const response = await fetch('/api/segue-pills/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personas: selectedPersonas,
            topics: selectedTopics,
            count: questionCount
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Server error: ${response.status}`)
        }

        questionsData = await response.json()
      }
      
      if (!questionsData.questions || questionsData.questions.length === 0) {
        throw new Error('No questions were generated')
      }
      
      setQuestions(questionsData.questions)
      setPhase('clustering')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Question generation error:', err)
      setError(`Failed to generate questions: ${errorMessage}`)
      setPhase('setup')
    } finally {
      setIsLoading(false)
    }
  }

  const clusterIntents = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get selected campaign goal if any
      const selectedGoal = selectedGoalId 
        ? campaignGoals.find(g => g.id === selectedGoalId)
        : null

      const response = await fetch('/api/segue-pills/cluster-intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          questions,
          campaignGoal: selectedGoal,
          qaProjectId: selectedProjectId // Pass Q&A project ID for answer validation
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.clusters || data.clusters.length === 0) {
        throw new Error('No intent clusters were generated')
      }
      
      setIntentClusters(data.clusters)
      setPhase('recommendations')
      
      // Save research with intent clusters (status: testing)
      await saveResearchToDatabase()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Intent clustering error:', err)
      setError(`Failed to cluster intents: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const generateRecommendations = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get selected campaign goal if any
      const selectedGoal = selectedGoalId 
        ? campaignGoals.find(g => g.id === selectedGoalId)
        : null

      const response = await fetch('/api/segue-pills/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentClusters,
          campaignGoal: selectedGoal,
          testSessions: [],
          qaProjectId: selectedProjectId // Pass Q&A project ID for answer validation
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.recommendations) {
        throw new Error('No recommendations were generated')
      }

      const incomingLibrary = Array.isArray(data.recommendations.pillLibrary) ? data.recommendations.pillLibrary : []
      const mergedLibrary = libraryUpdateMode === 'append'
        ? mergePillLibraries(baseLibraryPills, incomingLibrary)
        : mergePillLibraries([], incomingLibrary)
      const mergedRecommendations: PillRecommendations = {
        ...data.recommendations,
        pillLibrary: mergedLibrary
      }

      setRecommendations(mergedRecommendations)
      setBaseLibraryPills(mergedLibrary)
      setPhase('complete')
      const addedCount = mergedLibrary.length - baseLibraryPills.length
      setNotice(
        libraryUpdateMode === 'append'
          ? `Added ${Math.max(0, addedCount)} new unique pills. Library now has ${mergedLibrary.length} pills.`
          : `Replaced library with ${mergedLibrary.length} pills from this run.`
      )
      
      // Save research to database
      await saveResearchToDatabase(mergedRecommendations)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Recommendations generation error:', err)
      setError(`Failed to generate recommendations: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const saveResearchToDatabase = async (
    finalRecommendations?: PillRecommendations,
    options?: { forceStatus?: string }
  ) => {
    try {
      const effectiveRecommendations = finalRecommendations || recommendations
      const effectivePillLibrary =
        (effectiveRecommendations?.pillLibrary && Array.isArray(effectiveRecommendations.pillLibrary)
          ? effectiveRecommendations.pillLibrary
          : baseLibraryPills) || []

      const researchData = {
        id: savedResearchId || undefined,
        name: projectName || `Research ${new Date().toLocaleDateString()}`,
        description: `Generated ${questions.length} questions, ${intentClusters.length} intent clusters`,
        personas: selectedPersonas,
        topics: selectedTopics,
        questionCount: questions.length,
        syntheticQuestions: questions.length > 0 ? questions : null,
        scrapedQuestions: null,
        scrapedUrls: [],
        intentClusters: intentClusters.length > 0 ? intentClusters : null,
        pillLibrary: effectivePillLibrary.length > 0 ? effectivePillLibrary : null,
        recommendations: effectiveRecommendations || null,
        campaignGoalId: selectedGoalId || null,
        qaProjectId: selectedProjectId || null,
        status: options?.forceStatus || (effectiveRecommendations ? 'completed' : (intentClusters.length > 0 ? 'testing' : 'draft'))
      }

      const response = await fetch('/api/segue-pills/researches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(researchData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save research')
      }

      const data = await response.json()
      setSavedResearchId(data.research.id)
      setResearchStatus(data.research.status || researchStatus)
      const persistedLibrary = Array.isArray(data.research?.pillLibrary) ? data.research.pillLibrary : effectivePillLibrary
      setBaseLibraryPills(persistedLibrary)
      console.log('Research saved:', data.research.id)
    } catch (error) {
      console.error('Failed to save research:', error)
      // Don't throw - allow user to continue even if save fails
    }
  }

  const resetResearch = () => {
    setPhase('setup')
    setQuestions([])
    setIntentClusters([])
    setRecommendations(null)
    setError(null)
    setNotice(null)
    setSavedResearchId(null)
    setResearchStatus('draft')
  }

  const exportRecommendations = () => {
    if (!recommendations) return
    
    const data = JSON.stringify(recommendations, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `segue-pills-recommendations-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const removePillFromRecommendations = (current: PillRecommendations, pillId: string): PillRecommendations => {
    const filterPill = (pill: any) => pill && pill.id !== pillId

    return {
      ...current,
      pillLibrary: (current.pillLibrary || []).filter(filterPill),
      case1: {
        ...current.case1,
        pills: (current.case1?.pills || []).filter(filterPill)
      },
      case2: {
        ...current.case2,
        pills: (current.case2?.pills || []).filter(filterPill)
      },
      case3: {
        ...current.case3,
        pills: (current.case3?.pills || []).filter(filterPill)
      }
    }
  }

  const updatePillLabelInRecommendations = (
    current: PillRecommendations,
    pillId: string,
    newLabel: string
  ): PillRecommendations => {
    const updateLabel = (pill: any) => {
      if (!pill || pill.id !== pillId) return pill
      return { ...pill, label: newLabel }
    }

    return {
      ...current,
      pillLibrary: (current.pillLibrary || []).map(updateLabel),
      case1: {
        ...current.case1,
        pills: (current.case1?.pills || []).map(updateLabel)
      },
      case2: {
        ...current.case2,
        pills: (current.case2?.pills || []).map(updateLabel)
      },
      case3: {
        ...current.case3,
        pills: (current.case3?.pills || []).map(updateLabel)
      }
    }
  }

  const persistRecommendationsUpdate = async (updatedRecommendations: PillRecommendations) => {
    if (!savedResearchId) {
      throw new Error('Research project is not saved yet')
    }

    const response = await fetch('/api/segue-pills/researches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: savedResearchId,
        name: projectName || `Research ${new Date().toLocaleDateString()}`,
        description: `Generated ${questions.length} questions, ${intentClusters.length} intent clusters`,
        personas: selectedPersonas,
        topics: selectedTopics,
        questionCount: questions.length,
        syntheticQuestions: questions.length > 0 ? questions : null,
        scrapedQuestions: null,
        scrapedUrls: [],
        intentClusters: intentClusters.length > 0 ? intentClusters : null,
        pillLibrary: updatedRecommendations.pillLibrary || null,
        recommendations: updatedRecommendations,
        campaignGoalId: selectedGoalId || null,
        qaProjectId: selectedProjectId || null,
        status: researchStatus === 'published' ? 'published' : 'completed'
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to persist pill changes')
    }
  }

  const handleDeletePill = async (pillId: string) => {
    if (!recommendations || !savedResearchId) return

    const updatedRecommendations = removePillFromRecommendations(recommendations, pillId)
    const previousRecommendations = recommendations

    // Optimistic update for immediate UI feedback
    setRecommendations(updatedRecommendations)
    setBaseLibraryPills(updatedRecommendations.pillLibrary || [])

    try {
      await persistRecommendationsUpdate(updatedRecommendations)
    } catch (err) {
      // Rollback on failure
      setRecommendations(previousRecommendations)
      setBaseLibraryPills(previousRecommendations.pillLibrary || [])
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete pill'
      setError(errorMessage)
    }
  }

  const startEditPill = (pillId: string, currentLabel: string) => {
    setEditingPillId(pillId)
    setEditingPillLabel(currentLabel)
    setError(null)
  }

  const cancelEditPill = () => {
    setEditingPillId(null)
    setEditingPillLabel('')
  }

  const saveEditPill = async (pillId: string) => {
    if (!recommendations || !savedResearchId) return

    const nextLabel = editingPillLabel.trim()
    if (!nextLabel) {
      setError('Pill label cannot be empty.')
      return
    }

    const updatedRecommendations = updatePillLabelInRecommendations(recommendations, pillId, nextLabel)
    const previousRecommendations = recommendations

    // Optimistic update
    setRecommendations(updatedRecommendations)
    setBaseLibraryPills(updatedRecommendations.pillLibrary || [])
    setEditingPillId(null)
    setEditingPillLabel('')

    try {
      await persistRecommendationsUpdate(updatedRecommendations)
    } catch (err) {
      // Rollback
      setRecommendations(previousRecommendations)
      setBaseLibraryPills(previousRecommendations.pillLibrary || [])
      const errorMessage = err instanceof Error ? err.message : 'Failed to save pill edit'
      setError(errorMessage)
    }
  }

  const handlePublishToggle = async () => {
    if (!savedResearchId || !recommendations) {
      setError('Generate recommendations before publishing.')
      return
    }

    const nextStatus = researchStatus === 'published' ? 'completed' : 'published'
    setError(null)
    setNotice(null)
    setIsLoading(true)
    try {
      await saveResearchToDatabase(recommendations, { forceStatus: nextStatus })
      setNotice(nextStatus === 'published' ? 'Research published for chatbot use.' : 'Research unpublished (kept as completed).')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update publish status'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getPillBorderClass = (type: string): string => {
    if (type === 'anticipate') return 'border-sky-500/60'
    if (type === 'entice') return 'border-violet-500/60'
    // Generic/business/CTA bucket
    return 'border-emerald-500/60'
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              🧪 Segue Pills Research Lab
            </h1>
            <p className="text-muted-foreground">
              Generate, test, and optimize chatbot segue pills using AI-powered research
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/content/segue-pills/list" className="text-sm text-primary hover:underline">
              View All Research Projects →
            </a>
            <a href="/content/segue-pills/goals" className="text-sm text-primary hover:underline">
              Manage Campaign Goals →
            </a>
          </div>
        </div>

        {loadingExistingResearch && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 p-4 mb-6">
            <p className="text-blue-800 dark:text-blue-200">Loading existing research project...</p>
          </Card>
        )}

        {error && (
          <Card className="bg-red-50 border-red-200 p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </Card>
        )}

        {notice && (
          <Card className="bg-blue-50 border-blue-200 p-4 mb-6">
            <p className="text-blue-800">{notice}</p>
          </Card>
        )}

        {/* Phase Indicator */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            {['setup', 'generating', 'clustering', 'recommendations', 'complete'].map((p, idx) => (
              <div key={p} className="flex items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold
                    ${phase === p ? 'bg-primary text-primary-foreground' : 
                      idx < ['setup', 'generating', 'clustering', 'recommendations', 'complete'].indexOf(phase)
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'}
                  `}
                >
                  {idx + 1}
                </div>
                {idx < 4 && (
                  <div className={`w-16 h-1 ${idx < ['setup', 'generating', 'clustering', 'recommendations', 'complete'].indexOf(phase) ? 'bg-green-500' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Phase: Setup */}
        {phase === 'setup' && (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">📋 Project Setup</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="projectName">Research Project Name</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Q1 2026 Pill Research"
                  />
                </div>

                <div className="rounded-lg border border-border p-3 bg-muted/20">
                  <p className="text-sm font-medium mb-2">Library Update Strategy</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setLibraryUpdateMode('append')}
                      className={`px-3 py-1.5 rounded border text-sm ${libraryUpdateMode === 'append' ? 'border-primary bg-primary/10' : 'border-border'}`}
                    >
                      Append new pills (default)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLibraryUpdateMode('replace')}
                      className={`px-3 py-1.5 rounded border text-sm ${libraryUpdateMode === 'replace' ? 'border-primary bg-primary/10' : 'border-border'}`}
                    >
                      Replace with latest run
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Current stored library: {baseLibraryPills.length} pill{baseLibraryPills.length !== 1 ? 's' : ''}. This setting controls what happens on the next recommendation run.
                  </p>
                </div>

                <div>
                  <Label htmlFor="qaProjectSelect">Link to Q&A Project *</Label>
                  {availableProjects.length === 0 ? (
                    <div className="mt-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
                        No Q&A projects available
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                        You need to create a Q&A project first before generating pills.
                      </p>
                      <a
                        href="/content/new"
                        className="text-sm text-yellow-800 dark:text-yellow-200 underline font-semibold"
                      >
                        Create Q&A Project →
                      </a>
                    </div>
                  ) : (
                    <>
                      <select
                        id="qaProjectSelect"
                        value={selectedProjectId}
                        onChange={(e) => {
                          invalidateDownstreamForSetupChange('linked Q&A project changed')
                          setSelectedProjectId(e.target.value)
                        }}
                        className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                        required
                      >
                        <option value="">Choose a Q&A project...</option>
                        {availableProjects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name} ({project.questionCount || 0} questions) - {project.status}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-muted-foreground mt-1">
                        This pill research will be linked to the selected Q&A project. The chatbot will use this project&apos;s Q&A content when testing pills.
                      </p>
                      {selectedProjectId && availableProjects.find(p => p.id === selectedProjectId) && (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm">
                          <p className="font-semibold text-green-800 dark:text-green-200">
                            ✓ Linked to: {availableProjects.find(p => p.id === selectedProjectId)?.name}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <Label>Question Source</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => {
                        invalidateDownstreamForSetupChange('question source changed')
                        setSourceType('synthetic')
                      }}
                      className={`
                        p-4 rounded-lg border-2 text-left transition
                        ${sourceType === 'synthetic'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'}
                      `}
                    >
                      <div className="font-bold mb-1">🤖 Generate New</div>
                      <div className="text-sm text-muted-foreground">
                        AI generates {questionCount} synthetic questions
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        invalidateDownstreamForSetupChange('question source changed')
                        setSourceType('import')
                      }}
                      className={`
                        p-4 rounded-lg border-2 text-left transition
                        ${sourceType === 'import'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'}
                      `}
                    >
                      <div className="font-bold mb-1">📁 Import Existing</div>
                      <div className="text-sm text-muted-foreground">
                        Use questions from a Q&A project
                      </div>
                    </button>
                  </div>
                </div>

                {sourceType === 'import' && (
                  <div>
                    <Label htmlFor="projectSelect">Select Q&A Project</Label>
                    <select
                      id="projectSelect"
                      value={selectedProjectId}
                      onChange={(e) => {
                        invalidateDownstreamForSetupChange('import project changed')
                        setSelectedProjectId(e.target.value)
                      }}
                      className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                    >
                      <option value="">Choose a project...</option>
                      {availableProjects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name} ({project.questionCount} questions)
                        </option>
                      ))}
                    </select>
                    {selectedProjectId && availableProjects.find(p => p.id === selectedProjectId) && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-sm">
                        <p className="font-semibold text-green-800">
                          ✓ {availableProjects.find(p => p.id === selectedProjectId)?.questionCount} approved questions available
                        </p>
                        {availableProjects.find(p => p.id === selectedProjectId)?.corpus && (
                          <p className="text-green-700 mt-1">
                            Source: {availableProjects.find(p => p.id === selectedProjectId)?.corpus.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {sourceType === 'synthetic' && (
                  <>
                    <div>
                      <Label htmlFor="questionCount">Number of Questions to Generate</Label>
                      <Input
                        id="questionCount"
                        type="number"
                        value={questionCount}
                        onChange={(e) => {
                          invalidateDownstreamForSetupChange('question count changed')
                          setQuestionCount(parseInt(e.target.value))
                        }}
                        min={10}
                        max={500}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Recommended: 100-150 questions for balanced research
                      </p>
                    </div>
                  </>
                )}

                {sourceType === 'synthetic' && (
                  <>
                    <div>
                      <Label>Target Personas</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {personas.map(persona => (
                          <button
                            key={persona.id}
                            onClick={() => togglePersona(persona.id)}
                            className={`
                              p-3 rounded-lg border-2 text-left transition
                              ${selectedPersonas.includes(persona.id)
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'}
                            `}
                          >
                            {persona.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Topics to Cover</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {topics.map(topic => (
                          <button
                            key={topic.id}
                            onClick={() => toggleTopic(topic.id)}
                            className={`
                              p-3 rounded-lg border-2 text-left transition
                              ${selectedTopics.includes(topic.id)
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'}
                            `}
                          >
                            {topic.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label htmlFor="campaignGoal">Campaign Goal (Optional)</Label>
                  <select
                    id="campaignGoal"
                    value={selectedGoalId}
                    onChange={(e) => {
                      invalidateDownstreamForSetupChange('campaign goal changed')
                      setSelectedGoalId(e.target.value)
                    }}
                    className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="">No specific goal</option>
                    {campaignGoals.map(goal => (
                      <option key={goal.id} value={goal.id}>
                        {goal.name} ({goal.goalType})
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-muted-foreground mt-1">
                    🎯 Campaign goals influence pill label generation and final recommendations
                  </p>
                  {selectedGoalId && campaignGoals.find(g => g.id === selectedGoalId) && (
                    <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded text-sm">
                      <p className="font-semibold text-primary mb-1">
                        ✓ Active Goal: {campaignGoals.find(g => g.id === selectedGoalId)?.name}
                      </p>
                      <p className="text-muted-foreground">
                        {campaignGoals.find(g => g.id === selectedGoalId)?.businessPrompt}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={generateQuestions}
                disabled={isLoading || (sourceType === 'synthetic' && (selectedPersonas.length === 0 || selectedTopics.length === 0)) || (sourceType === 'import' && !selectedProjectId)}
                className="mt-6 w-full"
                size="lg"
              >
                {isLoading 
                  ? '🔄 Loading Questions...' 
                  : sourceType === 'import' 
                    ? '📥 Import & Analyze Questions'
                    : '🚀 Generate Synthetic Questions'
                }
              </Button>
            </div>
          </Card>
        )}

        {/* Phase: Generating/Clustering */}
        {(phase === 'generating' || phase === 'clustering') && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">
              {phase === 'generating' ? '⚙️ Generating Questions' : '📊 Questions Generated'}
            </h2>
            
            {questions.length > 0 && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-green-800 font-semibold">
                    ✅ Successfully generated {questions.length} synthetic questions
                  </p>
                </div>

                <div className="max-h-96 overflow-y-auto border rounded-lg p-4 space-y-2">
                  {questions.slice(0, 20).map((q, idx) => (
                    <div key={q.id} className="border-b pb-2">
                      <p className="font-medium">{idx + 1}. {q.question}</p>
                      <p className="text-sm text-muted-foreground">
                        Intent: {q.intent} | Persona: {q.persona} | Confidence: {(q.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))}
                  {questions.length > 20 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      ... and {questions.length - 20} more questions
                    </p>
                  )}
                </div>

                <Button
                  onClick={clusterIntents}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? '🔄 Clustering Intents...' : '🎯 Cluster Questions into Intents'}
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Phase: Recommendations */}
        {phase === 'recommendations' && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">🎯 Intent Clusters</h2>
            
            {intentClusters.length > 0 && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-green-800 font-semibold">
                    ✅ Identified {intentClusters.length} intent categories
                  </p>
                  {selectedGoalId && campaignGoals.find(g => g.id === selectedGoalId) && (
                    <p className="text-green-700 mt-2 text-sm">
                      🎯 Pill labels were generated with &quot;{campaignGoals.find(g => g.id === selectedGoalId)?.name}&quot; campaign goal in mind
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {intentClusters.map((cluster, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <h3 className="font-bold text-lg mb-2">{cluster.intent}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{cluster.description}</p>
                      <p className="text-sm font-medium mb-2">
                        {cluster.frequency} questions ({((cluster.frequency / questions.length) * 100).toFixed(1)}%)
                      </p>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Pill Candidates:</p>
                        {cluster.pillCandidates.slice(0, 3).map((pill, pidx) => (
                          <div key={pidx} className="bg-muted px-2 py-1 rounded text-sm">
                            {pill}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={generateRecommendations}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading
                    ? '🔄 Generating Recommendations...'
                    : libraryUpdateMode === 'append'
                      ? '💡 Generate & Append to Library'
                      : '💡 Generate & Replace Library'}
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Phase: Complete */}
        {phase === 'complete' && recommendations && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">🎉 Recommendations Complete</h2>
                  <Badge variant={researchStatus === 'published' ? 'default' : 'secondary'}>
                    {researchStatus}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handlePublishToggle}
                    variant={researchStatus === 'published' ? 'secondary' : 'default'}
                    disabled={isLoading || !savedResearchId}
                  >
                    {researchStatus === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button
                    onClick={() => setPhase('setup')}
                    variant="outline"
                  >
                    Edit Setup
                  </Button>
                  <Button onClick={exportRecommendations} variant="outline">
                    📥 Export JSON
                  </Button>
                  <Button onClick={resetResearch} variant="outline">
                    🔄 New Research
                  </Button>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
                <p className="text-green-800 font-semibold">
                  ✅ Generated recommendations for all 3 use cases with {recommendations.pillLibrary.length} total pills in library
                </p>
                <p className="text-green-700 text-sm mt-1">
                  Workflow mode: <strong>{libraryUpdateMode === 'append' ? 'Append' : 'Replace'}</strong> | Stored project library: {baseLibraryPills.length} pills
                </p>
              </div>

              {/* Case 1 */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3">Case 1: Unknown User (Generic Default)</h3>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {recommendations.case1.pills.map((pill: any) => (
                    <div key={pill.id} className={`border-2 ${getPillBorderClass(pill.type)} bg-primary/5 rounded-lg p-3 text-center`}>
                      <p className="font-medium">{pill.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{pill.type}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-muted p-3 rounded text-sm">
                  <p className="font-medium mb-1">Reasoning:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {recommendations.case1.reasoning.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Case 2 */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3">Case 2: Some Data (Page/Referral Context)</h3>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {recommendations.case2.pills.map((pill: any) => (
                    <div key={pill.id} className={`border-2 ${getPillBorderClass(pill.type)} bg-primary/5 rounded-lg p-3 text-center`}>
                      <p className="font-medium">{pill.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{pill.type}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-muted p-3 rounded text-sm">
                  <p className="font-medium mb-1">Reasoning:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {recommendations.case2.reasoning.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Case 3 */}
              <div>
                <h3 className="text-xl font-bold mb-3">Case 3: Rich Data (Behavior + Engagement)</h3>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {recommendations.case3.pills.map((pill: any) => (
                    <div key={pill.id} className={`border-2 ${getPillBorderClass(pill.type)} bg-primary/5 rounded-lg p-3 text-center`}>
                      <p className="font-medium">{pill.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{pill.type}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-muted p-3 rounded text-sm">
                  <p className="font-medium mb-1">Reasoning:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {recommendations.case3.reasoning.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Full Pill Library */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">📚 Complete Pill Library ({recommendations.pillLibrary.length} pills)</h3>
              <div className="grid grid-cols-3 gap-3">
                {recommendations.pillLibrary.map((pill: any) => (
                  <div key={pill.id} className="border rounded-lg p-3">
                    {editingPillId === pill.id ? (
                      <Input
                        value={editingPillLabel}
                        onChange={(e) => setEditingPillLabel(e.target.value)}
                        className="h-7 text-xs mb-1"
                        autoFocus
                      />
                    ) : (
                      <p className="font-medium mb-1">{pill.label}</p>
                    )}
                    <div className="flex gap-2 text-xs">
                      <span className="bg-muted px-2 py-1 rounded">{pill.type}</span>
                      <span className="bg-muted px-2 py-1 rounded">{pill.intent}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Confidence: {(pill.confidence * 100).toFixed(0)}% | Use Cases: {pill.useCase.join(', ')}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      {editingPillId === pill.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEditPill(pill.id)}
                            className="text-xs text-primary hover:underline"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditPill}
                            className="text-xs text-muted-foreground hover:underline"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditPill(pill.id, pill.label)}
                            className="text-xs text-primary hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePill(pill.id)}
                            className="text-xs text-red-600 hover:text-red-700 hover:underline"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SeguePillsResearchLab() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading research lab...</p>
        </div>
      </div>
    }>
      <SeguePillsResearchLabContent />
    </Suspense>
  )
}
