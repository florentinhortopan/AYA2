'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

export default function SeguePillsResearchLab() {
  const [phase, setPhase] = useState<ResearchPhase>('setup')
  const [isLoading, setIsLoading] = useState(false)
  
  // Setup parameters
  const [projectName, setProjectName] = useState('')
  const [questionCount, setQuestionCount] = useState(100)
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(['high_school', 'career_changer'])
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['eligibility', 'careers', 'benefits'])
  
  // Generated data
  const [questions, setQuestions] = useState<SyntheticQuestion[]>([])
  const [intentClusters, setIntentClusters] = useState<IntentCluster[]>([])
  const [recommendations, setRecommendations] = useState<PillRecommendations | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const togglePersona = (personaId: string) => {
    setSelectedPersonas(prev =>
      prev.includes(personaId)
        ? prev.filter(p => p !== personaId)
        : [...prev, personaId]
    )
  }

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(t => t !== topicId)
        : [...prev, topicId]
    )
  }

  const generateQuestions = async () => {
    if (selectedPersonas.length === 0 || selectedTopics.length === 0) {
      setError('Please select at least one persona and one topic')
      return
    }

    setIsLoading(true)
    setError(null)
    setPhase('generating')

    try {
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

      const data = await response.json()
      
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions were generated')
      }
      
      setQuestions(data.questions)
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
      const response = await fetch('/api/segue-pills/cluster-intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions })
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
      const response = await fetch('/api/segue-pills/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentClusters,
          campaignGoal: null, // TODO: Add campaign goal support
          testSessions: []
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
      
      setRecommendations(data.recommendations)
      setPhase('complete')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Recommendations generation error:', err)
      setError(`Failed to generate recommendations: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const resetResearch = () => {
    setPhase('setup')
    setQuestions([])
    setIntentClusters([])
    setRecommendations(null)
    setError(null)
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            🧪 Segue Pills Research Lab
          </h1>
          <p className="text-muted-foreground">
            Generate, test, and optimize chatbot segue pills using AI-powered research
          </p>
        </div>

        {error && (
          <Card className="bg-red-50 border-red-200 p-4 mb-6">
            <p className="text-red-800">{error}</p>
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
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Q1 2026 Recruitment Campaign"
                  />
                </div>

                <div>
                  <Label htmlFor="questionCount">Number of Questions to Generate</Label>
                  <Input
                    id="questionCount"
                    type="number"
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                    min={10}
                    max={500}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Recommended: 100-150 questions for balanced research
                  </p>
                </div>

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
              </div>

              <Button
                onClick={generateQuestions}
                disabled={isLoading || selectedPersonas.length === 0 || selectedTopics.length === 0}
                className="mt-6 w-full"
                size="lg"
              >
                {isLoading ? '🔄 Generating Questions...' : '🚀 Generate Synthetic Questions'}
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
                  {isLoading ? '🔄 Generating Recommendations...' : '💡 Generate Final Recommendations'}
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
                <h2 className="text-2xl font-bold">🎉 Recommendations Complete</h2>
                <div className="flex gap-2">
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
              </div>

              {/* Case 1 */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3">Case 1: Unknown User (Generic Default)</h3>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {recommendations.case1.pills.map((pill: any) => (
                    <div key={pill.id} className="border-2 border-primary bg-primary/5 rounded-lg p-3 text-center">
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
                    <div key={pill.id} className="border-2 border-primary bg-primary/5 rounded-lg p-3 text-center">
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
                    <div key={pill.id} className="border-2 border-primary bg-primary/5 rounded-lg p-3 text-center">
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
                    <p className="font-medium mb-1">{pill.label}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="bg-muted px-2 py-1 rounded">{pill.type}</span>
                      <span className="bg-muted px-2 py-1 rounded">{pill.intent}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Confidence: {(pill.confidence * 100).toFixed(0)}% | Use Cases: {pill.useCase.join(', ')}
                    </p>
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
