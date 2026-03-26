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

  return (
    <div className="space-y-8 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-black text-white">
        <Image
          src={activeCard.imageUrl}
          alt={activeCard.title}
          width={1600}
          height={900}
          className="h-[540px] w-full object-cover opacity-55 transition-opacity duration-700"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-black/10" />
        <div className="absolute inset-0 p-8 md:p-12">
          <Badge className="border-white/30 bg-white/10 text-white">Field Tested v4</Badge>
          <h2 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Picture yourself in the field, with a path that feels personal.
          </h2>
          <p className="mt-4 max-w-2xl text-base text-white/85 md:text-lg">
            A cinematic campaign layer inspired by Army Life flow: balance, milestones, proof, and a clear first action.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Start My Path</Button>
            <Button
              variant="outline"
              className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Talk To A Recruiter
            </Button>
          </div>
          <div className="mt-8 flex items-center gap-2">
            {cards.slice(0, 6).map((card, index) => (
              <button
                key={card.id}
                type="button"
                aria-label={`Open slide ${index + 1}`}
                onClick={() => setHeroSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === heroSlide ? 'w-10 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-3">
            <Badge variant="secondary" className="w-fit">
              Daily Life Lens
            </Badge>
            <CardTitle className="text-2xl">Step Into a Balanced Day</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="min-h-[110px] rounded-xl border border-border/70 bg-background/70 p-4">
              <p className="text-lg font-semibold">{daySlides[daySlide].title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{daySlides[daySlide].body}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {daySlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setDaySlide(index)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
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

        <Card className="border-border/70 bg-card/90">
          <CardHeader className="space-y-3">
            <Badge variant="secondary" className="w-fit">
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
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    activeLens === option.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  {option.title.replace(' Lens', '')}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-border/70 bg-background/70 p-4">
              <p className="font-semibold">{lens.subtitle}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lens.outcomes.map((outcome) => (
                  <Badge key={outcome} variant="outline" className="border-primary/30 text-foreground">
                    {outcome}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Milestone Flow</p>
            <h3 className="text-2xl font-semibold">Support For Every Milestone</h3>
          </div>
          <p className="text-sm text-muted-foreground">
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
              className={`rounded-xl border p-4 text-left transition-colors ${
                index === activeMilestone
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background/40 hover:border-primary/30'
              }`}
            >
              <p className="text-sm font-semibold">{milestone.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{milestone.body}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card">
          <Image
            src={activeStoryCard.imageUrl}
            alt={activeStoryCard.title}
            width={1400}
            height={900}
            className="h-[360px] w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-5 text-white">
            <p className="text-xl font-semibold">{activeStoryCard.title}</p>
            <p className="mt-2 text-sm text-white/85">{activeStoryCard.description}</p>
          </div>
        </div>
        <Card className="border-border/70 bg-card/90">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
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
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  index === storySlide
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border hover:border-primary/40 hover:text-primary'
                }`}
              >
                {card.title}
              </button>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Common Questions</p>
        <h3 className="mt-2 text-2xl font-semibold">Less Choppy, More Conversational</h3>
        <div className="mt-4 space-y-2">
          {faqItems.map((item, index) => (
            <div key={item.q} className="overflow-hidden rounded-lg border border-border/70 bg-background/70">
              <button
                type="button"
                onClick={() => setOpenFaq((current) => (current === index ? -1 : index))}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
              >
                {item.q}
                <span className="text-xs text-muted-foreground">{openFaq === index ? 'Hide' : 'Show'}</span>
              </button>
              <div className={`px-4 text-sm text-muted-foreground transition-all ${openFaq === index ? 'pb-4' : 'pb-0'}`}>
                {openFaq === index ? item.a : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-amber-500/10 to-background p-6">
        <h3 className="text-2xl font-semibold">Take the first step with confidence.</h3>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          This v4 experience keeps the original Army Life structure, but smooths navigation with visual continuity, quick
          lensing, and guided progression.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button>Talk to a Recruiter</Button>
          <Button variant="outline">Open Jobs Explorer</Button>
          <Button variant="outline">Start Soldier Prep Quiz</Button>
        </div>
      </section>
    </div>
  )
}
