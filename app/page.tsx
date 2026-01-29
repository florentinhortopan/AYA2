export default function Home() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Background overlay with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
      
      <div className="container mx-auto px-4 py-24 relative z-10">
        <div className="text-center space-y-8">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-gold">
            Welcome to Your Personalized Journey.
          </h1>
          <p className="text-xl md:text-2xl text-foreground max-w-3xl mx-auto font-medium">
            Explore career paths, access resources, and get AI-powered guidance tailored to
            your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-12">
            <a
              href="/explore"
              className="px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-semibold text-lg shadow-lg shadow-primary/20"
            >
              Take the First Step
            </a>
            <a
              href="/signup"
              className="px-8 py-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition font-semibold text-lg border border-border"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

