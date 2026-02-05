'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function CampaignGoalsPage() {
  const [goals, setGoals] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newGoal, setNewGoal] = useState({
    name: '',
    goalType: 'recruiter_contact',
    description: '',
    businessPrompt: '',
    minCount: 1,
    maxCount: 2,
    requiredPills: ''
  })

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const response = await fetch('/api/segue-pills/campaign-goals')
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals || [])
      }
    } catch (err) {
      console.error('Error loading goals:', err)
    }
  }

  const createGoal = async () => {
    setError(null)
    
    // Validation
    if (!newGoal.name.trim()) {
      setError('Campaign name is required')
      return
    }
    if (!newGoal.businessPrompt.trim()) {
      setError('Business prompt is required')
      return
    }

    try {
      const requiredPillsArray = newGoal.requiredPills
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0)

      const response = await fetch('/api/segue-pills/campaign-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGoal.name,
          goalType: newGoal.goalType,
          description: newGoal.description,
          businessPrompt: newGoal.businessPrompt,
          ctaRequirement: {
            minCount: newGoal.minCount,
            maxCount: newGoal.maxCount,
            requiredPills: requiredPillsArray
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server error: ${response.status}`)
      }

      const data = await response.json()
      
      // Success
      setIsCreating(false)
      setNewGoal({
        name: '',
        goalType: 'recruiter_contact',
        description: '',
        businessPrompt: '',
        minCount: 1,
        maxCount: 2,
        requiredPills: ''
      })
      loadGoals()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign goal'
      console.error('Error creating goal:', err)
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              🎯 Campaign Goals
            </h1>
            <p className="text-muted-foreground">
              Define business goals that influence pill recommendations
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/content/segue-pills">
              <Button variant="outline">← Back to Lab</Button>
            </Link>
            <Button onClick={() => setIsCreating(true)}>+ New Goal</Button>
          </div>
        </div>

        {isCreating && (
          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Create New Campaign Goal</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  placeholder="e.g., Q1 2026 Recruiter Push"
                />
              </div>

              <div>
                <Label htmlFor="goalType">Goal Type</Label>
                <select
                  id="goalType"
                  value={newGoal.goalType}
                  onChange={(e) => setNewGoal({ ...newGoal, goalType: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="recruiter_contact">Recruiter Contact</option>
                  <option value="assessment">Assessment Completion</option>
                  <option value="event_registration">Event Registration</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="What is this campaign about?"
                />
              </div>

              <div>
                <Label htmlFor="businessPrompt">Business Prompt</Label>
                <textarea
                  id="businessPrompt"
                  value={newGoal.businessPrompt}
                  onChange={(e) => setNewGoal({ ...newGoal, businessPrompt: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg min-h-24 bg-background text-foreground"
                  placeholder="e.g., Prioritize pills that lead users to contact a recruiter. Include at least one CTA pill in every recommendation."
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This prompt guides how pills are selected and prioritized
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minCount">Min CTA Pills</Label>
                  <Input
                    id="minCount"
                    type="number"
                    min={0}
                    max={4}
                    value={newGoal.minCount}
                    onChange={(e) => setNewGoal({ ...newGoal, minCount: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxCount">Max CTA Pills</Label>
                  <Input
                    id="maxCount"
                    type="number"
                    min={0}
                    max={4}
                    value={newGoal.maxCount}
                    onChange={(e) => setNewGoal({ ...newGoal, maxCount: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="requiredPills">Required Pills (comma-separated)</Label>
                <Input
                  id="requiredPills"
                  value={newGoal.requiredPills}
                  onChange={(e) => setNewGoal({ ...newGoal, requiredPills: e.target.value })}
                  placeholder="e.g., Talk to a recruiter, Schedule a chat"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={createGoal}>Create Goal</Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {goals.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No campaign goals yet. Create one to get started.
            </Card>
          ) : (
            goals.map(goal => (
              <Card key={goal.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{goal.name}</h3>
                    <div className="flex gap-2 mb-3">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-sm rounded">
                        {goal.goalType}
                      </span>
                      {goal.isActive && (
                        <span className="px-2 py-1 bg-green-500/10 text-green-600 text-sm rounded">
                          Active
                        </span>
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-muted-foreground mb-3">{goal.description}</p>
                    )}
                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="font-medium mb-1">Business Prompt:</p>
                      <p>{goal.businessPrompt}</p>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      <p>CTA Requirement: {goal.ctaRequirement.minCount}-{goal.ctaRequirement.maxCount} pills per set</p>
                      {goal.ctaRequirement.requiredPills && goal.ctaRequirement.requiredPills.length > 0 && (
                        <p>Required Pills: {goal.ctaRequirement.requiredPills.join(', ')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
