'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { TrendingUp, Brain, Heart, Activity, BarChart3, MessageSquare } from 'lucide-react'

interface InsightsData {
  profile: any
  progress: any[]
  activity: any
  usage: any
  conversations: any[]
  sentiment: any
  insights: any
  formattedContext: string
  recentActivities: any[]
}

export default function InsightsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<InsightsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated' && session?.user?.id) {
      fetchInsights()
    }
  }, [status, session, router])

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/user/insights')
      
      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }

      const insightsData = await response.json()
      setData(insightsData)
    } catch (err: any) {
      setError(err.message || 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading your insights...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-4xl">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-4xl">
          <Alert>
            <AlertTitle>No Data</AlertTitle>
            <AlertDescription>No insights data available yet. Start interacting with agents to generate insights.</AlertDescription>
          </Alert>
        </div>
      </main>
    )
  }

  const getSentimentColor = (sentiment?: string) => {
    if (!sentiment) return 'default'
    switch (sentiment.toLowerCase()) {
      case 'very_positive':
      case 'positive':
        return 'default'
      case 'neutral':
        return 'secondary'
      case 'negative':
      case 'very_negative':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getEngagementColor = (level?: string) => {
    if (!level) return 'default'
    switch (level.toLowerCase()) {
      case 'very_high':
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <h1 className="text-5xl font-bold tracking-tight mb-2 text-gold">
            Your Insights
          </h1>
          <p className="text-foreground text-lg">
            AI-powered analysis of your behavior, preferences, and engagement patterns
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sentiment Analysis */}
          {data.sentiment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Sentiment Analysis
                </CardTitle>
                <CardDescription>Overall mood and engagement from conversations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Sentiment</span>
                  <Badge variant={getSentimentColor(data.sentiment.sentiment)}>
                    {data.sentiment.sentiment}
                  </Badge>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Sentiment Score</span>
                    <span className="font-semibold">{(data.sentiment.score * 100).toFixed(0)}%</span>
                  </div>
                  <Progress 
                    value={(data.sentiment.score + 1) * 50} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    -1 (very negative) to 1 (very positive)
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Confidence</span>
                    <span className="font-semibold">{(data.sentiment.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={data.sentiment.confidence * 100} className="h-2" />
                </div>
                {data.sentiment.summary && (
                  <Alert>
                    <AlertDescription className="text-sm">
                      {data.sentiment.summary}
                    </AlertDescription>
                  </Alert>
                )}
                {data.sentiment.keywords && data.sentiment.keywords.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Key Emotional Indicators:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.sentiment.keywords.slice(0, 5).map((keyword: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Behavioral Insights */}
          {data.insights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Behavioral Insights
                </CardTitle>
                <CardDescription>AI-generated behavioral analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.insights.summary && (
                  <Alert>
                    <AlertTitle>Summary</AlertTitle>
                    <AlertDescription className="text-sm mt-2">
                      {data.insights.summary}
                    </AlertDescription>
                  </Alert>
                )}
                {data.insights.engagement && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Engagement Level</span>
                      <Badge variant={getEngagementColor(data.insights.engagement.level)}>
                        {data.insights.engagement.level}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {data.insights.engagement.description}
                    </p>
                  </div>
                )}
                {data.insights.preferences && data.insights.preferences.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Identified Preferences:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.insights.preferences.map((pref: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {pref}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {data.insights.personality?.traits && data.insights.personality.traits.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Personality Traits:</p>
                    <div className="flex flex-wrap gap-1">
                      {data.insights.personality.traits.map((trait: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {data.insights.recommendations && data.insights.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Recommended Approaches:</p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      {data.insights.recommendations.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Usage Patterns */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Usage Patterns
            </CardTitle>
            <CardDescription>How you interact with different agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.usage.agentCounts).map(([agent, count]) => (
                <div key={agent} className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{count as number}</p>
                  <p className="text-sm text-muted-foreground capitalize">{agent}</p>
                </div>
              ))}
            </div>
            {data.usage.mostUsedAgent && (
              <div className="mt-4">
                <p className="text-sm font-medium">
                  Most Used Agent: <span className="capitalize">{data.usage.mostUsedAgent}</span>
                  {' '}({data.usage.agentCounts[data.usage.mostUsedAgent] as number} sessions)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation History */}
        {data.conversations && data.conversations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation History
              </CardTitle>
              <CardDescription>Topics and patterns from your agent interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.conversations.map((conv: any) => (
                  <div key={conv.agentType} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold capitalize">{conv.agentType}</h4>
                        <p className="text-sm text-muted-foreground">
                          {conv.sessionCount} sessions • {conv.totalMessages} messages
                        </p>
                      </div>
                      <Badge variant="outline">{conv.agentType}</Badge>
                    </div>
                    {conv.topics && conv.topics.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Topics Discussed:</p>
                        <div className="flex flex-wrap gap-1">
                          {conv.topics.slice(0, 8).map((topic: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {data.recentActivities && data.recentActivities.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity (Last 7 Days)
              </CardTitle>
              <CardDescription>Your recent interactions and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recentActivities.slice(0, 10).map((activity: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div>
                      <span className="font-medium">{activity.type}</span>
                      {activity.agentType && (
                        <span className="text-muted-foreground"> • {activity.agentType}</span>
                      )}
                      {activity.action && (
                        <span className="text-muted-foreground"> • {activity.action}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formatted Context (Raw) */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Context Data</CardTitle>
            <CardDescription>The formatted context sent to AI agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-xs whitespace-pre-wrap font-mono overflow-auto max-h-96">
                {data.formattedContext}
              </pre>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                navigator.clipboard.writeText(data.formattedContext)
                alert('Context copied to clipboard!')
              }}
            >
              Copy to Clipboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

