'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Trophy, TrendingUp, Target, Activity } from 'lucide-react'

interface UserProgress {
  category: string
  level: number
  experience: number
  progress: any
}

interface UserProfile {
  interests: string[]
  fitnessLevel: string | null
  onboardingComplete: boolean
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [progress, setProgress] = useState<UserProgress[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session?.user?.id) {
      const fetchData = async () => {
        try {
          // Fetch profile
          const profileRes = await fetch('/api/profile/update')
          if (profileRes.ok) {
            const profileData = await profileRes.json()
            setProfile(profileData.profile)

            // Redirect to onboarding if not complete
            if (!profileData.profile.onboardingComplete) {
              router.push('/onboarding')
              return
            }
          }

          // Fetch progress
          const progressRes = await fetch('/api/progress')
          if (progressRes.ok) {
            const progressData = await progressRes.json()
            setProgress(progressData.progress || [])
          }

          // Fetch recent activity
          const activityRes = await fetch('/api/activity')
          if (activityRes.ok) {
            const activityData = await activityRes.json()
            setRecentActivity(activityData.activity || [])
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error)
        } finally {
          setLoading(false)
        }
      }

      fetchData()
    }
  }, [status, session, router])


  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </main>
    )
  }

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      career: 'Career',
      physical: 'Physical Training',
      mental: 'Mental Wellness',
      financial: 'Financial',
      education: 'Education'
    }
    return names[category] || category
  }

  const getNextLevelXP = (currentXP: number) => {
    const currentLevel = Math.floor(currentXP / 100) + 1
    const nextLevelXP = currentLevel * 100
    const currentLevelXP = (currentLevel - 1) * 100
    const progress = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
    return { progress, nextLevelXP, currentLevel }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <h1 className="text-5xl font-bold tracking-tight mb-2 text-gold">
            Dashboard
          </h1>
          <p className="text-foreground text-lg">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}! Here&apos;s your personalized overview.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* My Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                My Progress
              </CardTitle>
              <CardDescription>Track your training and career development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progress.map((prog) => {
                  const { progress: progressPercent, currentLevel, nextLevelXP } = getNextLevelXP(prog.experience)
                  return (
                    <div key={prog.category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{getCategoryName(prog.category)}</span>
                        <span className="font-semibold">Level {currentLevel}</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {prog.experience} / {nextLevelXP} XP
                      </p>
                    </div>
                  )
                })}
                {progress.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Start exploring to track your progress!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Achievements Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Achievements
              </CardTitle>
              <CardDescription>Your unlocked achievements</CardDescription>
            </CardHeader>
            <CardContent>
              {achievements.length > 0 ? (
                <div className="space-y-2">
                  {achievements.slice(0, 3).map((ach) => (
                    <div key={ach.id} className="flex items-center gap-2 p-2 border rounded">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="font-semibold text-sm">{ach.name}</p>
                        <p className="text-xs text-muted-foreground">{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-sm mb-4">
                    Start your journey to unlock achievements!
                  </p>
                  <Link href="/explore">
                    <Button size="sm" variant="outline">Get Started</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile?.fitnessLevel && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fitness Level</p>
                    <Badge variant="outline" className="capitalize">
                      {profile.fitnessLevel}
                    </Badge>
                  </div>
                )}
                {profile?.interests && profile.interests.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Interests</p>
                    <div className="flex flex-wrap gap-1">
                      {profile.interests.slice(0, 3).map((interest) => (
                        <Badge key={interest} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                      {profile.interests.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{profile.interests.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Link href="/profile" className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      Edit Profile
                    </Button>
                  </Link>
                  <Link href="/insights" className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      View Insights
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Assistants Card */}
          <Card>
            <CardHeader>
              <CardTitle>AI Assistants</CardTitle>
              <CardDescription>Get personalized guidance from our AI agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/explore/recruitment">
                  <Button variant="outline" className="w-full border-border hover:bg-muted">
                    Recruitment
                  </Button>
                </Link>
                <Link href="/explore/training">
                  <Button variant="outline" className="w-full border-border hover:bg-muted">
                    Training
                  </Button>
                </Link>
                <Link href="/explore/financial">
                  <Button variant="outline" className="w-full border-border hover:bg-muted">
                    Financial
                  </Button>
                </Link>
                <Link href="/explore/educational">
                  <Button variant="outline" className="w-full border-border hover:bg-muted">
                    Educational
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Your recent interactions and progress</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {recentActivity.slice(0, 5).map((activity, idx) => (
                    <div key={idx} className="text-sm p-2 border rounded">
                      <p className="font-medium">{activity.type}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-sm mb-4">
                    No recent activity. Start exploring!
                  </p>
                  <Link href="/explore">
                    <Button size="sm" variant="outline">Explore Features</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
