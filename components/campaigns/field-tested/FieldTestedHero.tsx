import { Button } from '@/components/ui/button'

interface FieldTestedHeroProps {
  onPrimary?: () => void
  onSecondary?: () => void
}

export function FieldTestedHero({ onPrimary, onSecondary }: FieldTestedHeroProps) {
  return (
    <section className="rounded-2xl border border-border bg-gradient-to-br from-slate-900 via-zinc-900 to-zinc-800 p-8 text-white shadow-sm">
      <p className="mb-3 inline-flex rounded-full border border-white/30 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/80">
        Campaign Instigation
      </p>
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">Unlock the warrior within.</h1>
      <p className="mt-4 max-w-2xl text-base text-white/80 md:text-lg">
        You do not have to show up ready. This journey is built to turn potential into proof through real stories,
        practical pathways, and a clear next step you can act on.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={onPrimary} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Start Your Journey
        </Button>
        <Button
          variant="outline"
          onClick={onSecondary}
          className="border-white/30 bg-transparent text-white hover:bg-white/10"
        >
          See Real Stories
        </Button>
      </div>
    </section>
  )
}
