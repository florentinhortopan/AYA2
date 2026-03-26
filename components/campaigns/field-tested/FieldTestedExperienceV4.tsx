'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { fallbackStoryCards, lensOptions } from '@/lib/campaigns/field-tested/content'
import { AudienceLens, FieldStoryCardAsset } from '@/lib/campaigns/field-tested/types'

type Milestone = {
  id: string
  title: string
  body: string
}

const daySlides = [
  {
    id: 'amenities',
    title: 'Amenities That Feel Familiar',
    body: 'You still have normal-day anchors: stores, food, gyms, and routines that keep life grounded.'
  },
  {
    id: 'housing',
    title: 'Housing With Real Options',
    body: 'From barracks to family-style homes and housing allowance pathways, stability has structure.'
  },
  {
    id: 'family',
    title: 'Family Connection Stays Central',
    body: 'Training and deployment periods vary, but communication and support systems remain part of the experience.'
  }
]

const milestones: Milestone[] = [
  {
    id: 'service',
    title: 'Service Commitment',
    body: 'A clear, contractual decision point so expectations are visible before momentum builds.'
  },
  {
    id: 'training',
    title: 'Training Foundation',
    body: 'Basic Training or Officer Training creates shared readiness and confidence through proven systems.'
  },
  {
    id: 'deployment',
    title: 'Deployment Context',
    body: 'Mission demands vary, but planning and support keep tradeoffs explicit and manageable.'
  }
]

const faqItems = [
  {
    q: 'How long is a workday in the Army?',
    a: 'Workdays vary by role and mission tempo. Some paths feel structured while others flex based on active objectives.'
  },
  {
    q: 'What are meals like for Soldiers?',
    a: 'On base there are standard options like commissary and dining facilities. In the field, meal systems adapt to mission conditions.'
  },
  {
    q: 'Will I get vacation days?',
    a: 'Paid time off, weekends, and holidays remain a core part of long-term readiness and life balance.'
  }
]

const quickLinks = [
  { id: 'day-in-life', label: 'Day in the Life' },
  { id: 'housing', label: 'Housing' },
  { id: 'family-life', label: 'Family Life' },
  { id: 'service-commitment', label: 'Service Commitment' },
  { id: 'deployment', label: 'Deployment' }
]

export function FieldTestedExperienceV4() {
  const [cards, setCards] = useState<FieldStoryCardAsset[]>(fallbackStoryCards)
  const [heroSlide, setHeroSlide] = useState(0)
  const [daySlide, setDaySlide] = useState(0)
  const [storySlide, setStorySlide] = useState(0)
  const [activeMilestone, setActiveMilestone] = useState(0)
  const [activeLens, setActiveLens] = useState<AudienceLens>('prospect')
  const [openFaq, setOpenFaq] = useState(0)

  useEffect(() => {
    const loadCampaignAssets = async () => {
      try {
        const response = await fetch('/api/campaigns/field-tested/assets', { cache: 'no-store' })
        if (!response.ok) return
        const payload = (await response.json()) as { cards?: FieldStoryCardAsset[] }
        if (payload.cards && payload.cards.length > 0) {
          setCards(payload.cards.slice(0, 12))
        }
      } catch {
        // Keep fallback cards.
      }
    }
    loadCampaignAssets()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((current) => (cards.length > 0 ? (current + 1) % cards.length : 0))
    }, 5500)
    return () => clearInterval(timer)
  }, [cards.length])

  const activeCard = cards[heroSlide] ?? fallbackStoryCards[0]
  const activeStoryCard = cards[storySlide] ?? fallbackStoryCards[0]
  const lens = lensOptions.find((item) => item.id === activeLens) ?? lensOptions[0]
  const milestoneProgress = useMemo(() => ((activeMilestone + 1) / milestones.length) * 100, [activeMilestone])
  const fullBleed = 'relative left-1/2 w-screen -translate-x-1/2'
  const sharpButton = 'rounded-none uppercase tracking-[0.12em]'

  return (
    <div className="space-y-10 pb-12">
      <section className={`${fullBleed} border-y border-border/40 bg-zinc-950 text-white`}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
          <Badge className="rounded-none border-white/30 bg-white/10 text-white">Field Tested v4</Badge>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/80">
            {quickLinks.map((item, index) => (
              <span key={item.id} className="inline-flex items-center gap-2">
                <span className="font-medium">{item.label}</span>
                {index < quickLinks.length - 1 ? <span className="text-white/50">{'>'}</span> : null}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className={`${fullBleed} relative overflow-hidden border-y border-border/40 bg-black text-white`}>
        <Image
          src={activeCard.imageUrl}
          alt={activeCard.title}
          width={1600}
          height={900}
          className="h-[620px] w-full object-cover opacity-60 transition-opacity duration-700"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-black/15" />
        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-6xl items-end px-6 pb-14">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-bold leading-tight md:text-6xl">
                Picture yourself in the field, with a path that feels personal.
              </h2>
              <p className="mt-4 max-w-2xl text-base text-white/85 md:text-lg">
                A richer take on Army Life storytelling with cleaner progression, stronger visual continuity, and less
                choppy transitions.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button className={`${sharpButton} bg-primary px-8 text-primary-foreground hover:bg-primary/90`}>
                  Start My Path
                </Button>
                <Button
                  variant="outline"
                  className={`${sharpButton} border-white/35 bg-transparent px-8 text-white hover:bg-white/10 hover:text-white`}
                >
                  Talk To A Recruiter
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 border-t border-white/20 px-6 py-4">
            <p className="text-xs uppercase tracking-[0.14em] text-white/75">Current Frame: {activeCard.title}</p>
            <div className="flex items-center gap-2">
              {cards.slice(0, 6).map((card, index) => (
                <button
                  key={card.id}
                  type="button"
                  aria-label={`Open slide ${index + 1}`}
                  onClick={() => setHeroSlide(index)}
                  className={`h-2 transition-all ${
                    index === heroSlide ? 'w-10 bg-white' : 'w-6 bg-white/35 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-none border-border/70 bg-card/90">
          <CardHeader className="space-y-3">
            <Badge variant="secondary" className="w-fit rounded-none">
              Daily Life Lens
            </Badge>
            <CardTitle className="text-2xl">Step Into a Balanced Day</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="min-h-[110px] border border-border/70 bg-background/70 p-4">
              <p className="text-lg font-semibold">{daySlides[daySlide].title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{daySlides[daySlide].body}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {daySlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setDaySlide(index)}
                  className={`border px-3 py-1.5 text-sm uppercase tracking-[0.1em] transition-colors ${
                    daySlide === index
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {slide.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border/70 bg-card/90">
          <CardHeader className="space-y-3">
            <Badge variant="secondary" className="w-fit rounded-none">
              Audience Lens
            </Badge>
            <CardTitle className="text-2xl">Tune The Story Arc</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {lensOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setActiveLens(option.id)}
                  className={`border px-3 py-1.5 text-sm uppercase tracking-[0.1em] transition-colors ${
                    activeLens === option.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {option.title.replace(' Lens', '')}
                </button>
              ))}
            </div>
            <div className="border border-border/70 bg-background/70 p-4">
              <p className="font-semibold">{lens.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lens.outcomes.map((outcome) => (
                  <Badge key={outcome} variant="outline" className="rounded-none border-primary/30 text-foreground">
                    {outcome}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className={`${fullBleed} border-y border-border/40 bg-zinc-900 py-10 text-zinc-100`}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Milestone Flow</p>
              <h3 className="text-2xl font-semibold">Support For Every Milestone</h3>
            </div>
            <p className="text-sm text-zinc-400">
              {activeMilestone + 1} / {milestones.length}
            </p>
          </div>
          <Progress value={milestoneProgress} className="mt-4 h-2" />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {milestones.map((milestone, index) => (
              <button
                key={milestone.id}
                type="button"
                onClick={() => setActiveMilestone(index)}
                className={`border p-4 text-left transition-colors ${
                  index === activeMilestone
                    ? 'border-primary bg-primary/15'
                    : 'border-zinc-700 bg-zinc-950/60 hover:border-primary/40'
                }`}
              >
                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                  <span className="text-primary">{'>'}</span>
                  {milestone.title}
                </p>
                <p className="mt-2 text-sm text-zinc-300">{milestone.body}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={`${fullBleed} bg-black py-10`}>
        <div className="mx-auto grid max-w-6xl gap-6 px-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden border border-white/15 bg-card">
            <Image
              src={activeStoryCard.imageUrl}
              alt={activeStoryCard.title}
              width={1400}
              height={900}
              className="h-[420px] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-5 text-white">
              <p className="text-xl font-semibold">{activeStoryCard.title}</p>
              <p className="mt-2 text-sm text-white/85">{activeStoryCard.description}</p>
            </div>
          </div>
          <Card className="rounded-none border-white/15 bg-zinc-950 text-zinc-100">
            <CardHeader>
              <Badge variant="secondary" className="w-fit rounded-none">
                Field Stories
              </Badge>
              <CardTitle className="text-2xl">Slideshow Control Deck</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cards.slice(0, 6).map((card, index) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setStorySlide(index)}
                  className={`w-full border px-3 py-2 text-left text-sm uppercase tracking-[0.08em] transition-colors ${
                    index === storySlide
                      ? 'border-primary bg-primary/15 text-zinc-100'
                      : 'border-zinc-700 hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {card.title}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className={`${fullBleed} border-y border-border/40 bg-background py-10`}>
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Common Questions</p>
          <h3 className="mt-2 text-2xl font-semibold">Less Choppy, More Conversational</h3>
          <div className="mt-4 space-y-2">
            {faqItems.map((item, index) => (
              <div key={item.q} className="overflow-hidden border border-border/70 bg-background/70">
                <button
                  type="button"
                  onClick={() => setOpenFaq((current) => (current === index ? -1 : index))}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="text-primary">{'>'}</span>
                    {item.q}
                  </span>
                  <span className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                    {openFaq === index ? 'Hide' : 'Show'}
                  </span>
                </button>
                <div className={`px-4 text-sm text-muted-foreground transition-all ${openFaq === index ? 'pb-4' : 'pb-0'}`}>
                  {openFaq === index ? item.a : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${fullBleed} border-t border-primary/30 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black py-12`}>
        <div className="mx-auto max-w-6xl px-6 text-zinc-100">
          <h3 className="text-3xl font-semibold">Take the first step with confidence.</h3>
          <p className="mt-2 max-w-2xl text-sm text-zinc-300">
            This refined v4 keeps the Army Life section rhythm while upgrading visual continuity through full-bleed bands,
            sharp action controls, and icon-led section anchors.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button className={`${sharpButton} px-7`}>Talk to a Recruiter</Button>
            <Button variant="outline" className={`${sharpButton} border-zinc-500 px-7 text-zinc-100 hover:bg-zinc-800`}>
              Open Jobs Explorer
            </Button>
            <Button variant="outline" className={`${sharpButton} border-zinc-500 px-7 text-zinc-100 hover:bg-zinc-800`}>
              Start Soldier Prep Quiz
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
