export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight">
            Welcome to AYAYA2
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your personalized army recruitment journey starts here. Explore career paths, 
            access training resources, and get AI-powered guidance - all before creating an account.
          </p>
          <div className="flex gap-4 justify-center pt-8">
            <a
              href="/explore"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
            >
              Explore Features
            </a>
            <a
              href="/signup"
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

