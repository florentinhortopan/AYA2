import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your personalized overview.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>My Progress</CardTitle>
              <CardDescription>Track your training and career development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Career Level</span>
                  <span className="font-semibold">Level 1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Physical Training</span>
                  <span className="font-semibold">Level 1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Mental Wellness</span>
                  <span className="font-semibold">Level 1</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Your unlocked achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  Start your journey to unlock achievements!
                </p>
                <Link href="/explore">
                  <Button className="mt-4">Get Started</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Community</CardTitle>
              <CardDescription>Engage with other users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/community">
                  <Button variant="outline" className="w-full">
                    Browse Content
                  </Button>
                </Link>
                <Link href="/community/create">
                  <Button variant="outline" className="w-full">
                    Create Post
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Assistants</CardTitle>
              <CardDescription>Get personalized guidance from our AI agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/explore/recruitment">
                  <Button variant="outline" className="w-full">Recruitment</Button>
                </Link>
                <Link href="/explore/training">
                  <Button variant="outline" className="w-full">Training</Button>
                </Link>
                <Link href="/explore/financial">
                  <Button variant="outline" className="w-full">Financial</Button>
                </Link>
                <Link href="/explore/educational">
                  <Button variant="outline" className="w-full">Educational</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent interactions and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  No recent activity. Start exploring!
                </p>
                <Link href="/explore">
                  <Button className="mt-4">Explore Features</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

