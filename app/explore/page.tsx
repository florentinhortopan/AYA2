import { AgentChat } from '@/components/agent-chat'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Target, Dumbbell, DollarSign, GraduationCap } from 'lucide-react'

const agents = [
  {
    type: 'recruitment' as const,
    title: 'Recruitment Assistant',
    description: 'Explore career paths, understand requirements, and get personalized recommendations.',
    icon: Target
  },
  {
    type: 'training' as const,
    title: 'Training Assistant',
    description: 'Get physical and mental training programs, track progress, and build your fitness.',
    icon: Dumbbell
  },
  {
    type: 'financial' as const,
    title: 'Financial Assistant',
    description: 'Understand military benefits, plan finances, and set savings goals.',
    icon: DollarSign
  },
  {
    type: 'educational' as const,
    title: 'Educational Assistant',
    description: 'Learn about educational opportunities, training programs, and skill development.',
    icon: GraduationCap
  }
]

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-gold">
            Explore Our AI Assistants
          </h1>
          <p className="text-xl text-foreground max-w-3xl mx-auto font-medium">
            Try our AI-powered assistants - no account required! Get personalized guidance 
            on career paths, training, finances, and education.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {agents.map((agent) => {
            const IconComponent = agent.icon
            return (
              <Card key={agent.type} className="hover:shadow-xl hover:shadow-primary/10 transition-all border-border/50 bg-card">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{agent.title}</CardTitle>
                      <CardDescription className="text-base">{agent.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link href={`/explore/${agent.type}`}>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Try {agent.title}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center bg-card border border-border rounded-lg p-8">
          <p className="text-foreground mb-6 text-lg font-medium">
            Want more? Create an account to access UGC content, detailed guides, and track your progress!
          </p>
          <Link href="/signup">
            <Button variant="outline" size="lg" className="border-gold text-gold hover:bg-primary/10">
              Create Free Account
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}

