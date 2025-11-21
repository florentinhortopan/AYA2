'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

const CAREER_INTERESTS = [
  'Combat', 'IT/Technology', 'Engineering', 'Medical', 'Intelligence',
  'Aviation', 'Mechanics', 'Administration', 'Logistics', 'Communications',
  'Special Forces', 'Leadership', 'Training'
]

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    age: '',
    location: '',
    interests: [] as string[],
    fitnessLevel: '',
    careerGoals: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const handleNext = () => {
    if (step === 1 && (!formData.age || !formData.location)) {
      alert('Please fill in all required fields')
      return
    }
    if (step === 2 && formData.interests.length === 0) {
      alert('Please select at least one interest')
      return
    }
    if (step === 3 && !formData.fitnessLevel) {
      alert('Please select your fitness level')
      return
    }
    setStep(prev => Math.min(prev + 1, 4))
  }

  const handlePrevious = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!formData.careerGoals.trim()) {
      alert('Please tell us about your career goals')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
          onboardingComplete: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Onboarding error:', error)
      alert('Failed to save your profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const progress = (step / 4) * 100

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to AYAYA2!</CardTitle>
          <CardDescription className="text-center">
            Let's set up your profile to personalize your experience
          </CardDescription>
          <Progress value={progress} className="mt-4" />
          <p className="text-sm text-center text-muted-foreground mt-2">
            Step {step} of 4
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  min="17"
                  max="65"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="Enter your age"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, State (e.g., New York, NY)"
                />
              </div>
            </div>
          )}

          {/* Step 2: Interests */}
          {step === 2 && (
            <div className="space-y-4">
              <Label>What career paths interest you? *</Label>
              <p className="text-sm text-muted-foreground">
                Select all that apply - you can change these later
              </p>
              <div className="flex flex-wrap gap-2">
                {CAREER_INTERESTS.map((interest) => (
                  <Badge
                    key={interest}
                    variant={formData.interests.includes(interest) ? 'default' : 'outline'}
                    className="cursor-pointer text-sm px-3 py-1"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Selected: {formData.interests.length} {formData.interests.length === 1 ? 'interest' : 'interests'}
              </p>
            </div>
          )}

          {/* Step 3: Fitness Level */}
          {step === 3 && (
            <div className="space-y-4">
              <Label htmlFor="fitnessLevel">Current Fitness Level *</Label>
              <Select
                value={formData.fitnessLevel}
                onValueChange={(value) => setFormData(prev => ({ ...prev, fitnessLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your fitness level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner - Just getting started</SelectItem>
                  <SelectItem value="intermediate">Intermediate - Regular exercise routine</SelectItem>
                  <SelectItem value="advanced">Advanced - High fitness level</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                This helps us recommend appropriate training programs for you.
              </p>
            </div>
          )}

          {/* Step 4: Career Goals */}
          {step === 4 && (
            <div className="space-y-4">
              <Label htmlFor="careerGoals">Tell us about your career goals *</Label>
              <textarea
                id="careerGoals"
                className="w-full min-h-[150px] p-3 border border-border rounded-md bg-background text-foreground"
                value={formData.careerGoals}
                onChange={(e) => setFormData(prev => ({ ...prev, careerGoals: e.target.value }))}
                placeholder="What do you hope to achieve in your military career? What motivates you to join?"
              />
              <p className="text-sm text-muted-foreground">
                This helps our AI agents provide personalized recommendations.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={step === 1}
            >
              Previous
            </Button>
            {step < 4 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Complete Setup'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

