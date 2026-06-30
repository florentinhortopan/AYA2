'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  QA_INSIGHTS_SLIDES,
  QA_INSIGHTS_SUMMARY,
  type QaEvidenceItem,
  type QaInsightStat,
  type QaInsightTheme,
  type QaInsightsSection,
  type QaInsightsSlide,
  type QaRiskItem,
  type QaRoadmapColumn,
  type QaThemeIssueCluster,
  type QaThemeSignal,
} from '@/lib/content-testing/qa-insights-deck'
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Maximize,
  Minimize,
  ShieldCheck,
  Target,
  Route,
  MessageSquareQuote,
  AlertTriangle,
  Layers3,
  Compass,
  BarChart3,
  FileText,
} from 'lucide-react'

gsap.registerPlugin(useGSAP)

const SECTION_STYLES: Record<QaInsightsSection, string> = {
  Overview: 'border-stone-400/30 bg-stone-400/10 text-stone-100',
  Method: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  Themes: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100',
  Findings: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  Recommendations: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-100',
  'Wrap-up': 'border-lime-400/30 bg-lime-400/10 text-lime-100',
  Appendix: 'border-violet-400/30 bg-violet-400/10 text-violet-100',
}

const SECTION_ORDER: QaInsightsSection[] = [
  'Overview',
  'Method',
  'Themes',
  'Findings',
  'Recommendations',
  'Wrap-up',
  'Appendix',
]

const ICONS = [ShieldCheck, Target, MessageSquareQuote, Route]
const DATA_BAR_FILL_CLASS = 'h-full rounded-full bg-gradient-to-r from-primary/20 via-primary/60 to-primary'

function shouldShowEvidenceByDefault(slide: QaInsightsSlide) {
  return Boolean(slide.evidence?.length) && (slide.visual === 'themeCards' || slide.visual === 'evidenceGrid')
}

export function QaInsightsDeck({
  slides = QA_INSIGHTS_SLIDES,
  summary = QA_INSIGHTS_SUMMARY,
  storageKey = 'qa-insights-deck-index',
  deckLabel = 'QA Insights Deck',
}: {
  slides?: QaInsightsSlide[]
  summary?: string
  storageKey?: string
  deckLabel?: string
}) {
  const total = slides.length

  const [index, setIndex] = useState(0)
  const [showEvidence, setShowEvidence] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const slideRef = useRef<HTMLDivElement>(null)
  const restoredRef = useRef(false)

  const slide = slides[index]
  const progressPct = ((index + 1) / total) * 100

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const restored = Number(raw)
        if (Number.isFinite(restored)) setIndex(Math.max(0, Math.min(total - 1, restored)))
      }
    } catch {
      /* ignore */
    }
    restoredRef.current = true
  }, [total])

  useEffect(() => {
    if (!restoredRef.current) return
    try {
      localStorage.setItem(storageKey, String(index))
    } catch {
      /* ignore */
    }
  }, [index])

  useEffect(() => {
    setShowEvidence(shouldShowEvidenceByDefault(slide))
  }, [slide])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { motion } = ctx.conditions as { motion: boolean }
          const revealItems = gsap.utils.toArray<HTMLElement>('.deck-reveal')
          const evidenceItems = gsap.utils.toArray<HTMLElement>('.evidence-reveal')

          if (!motion) {
            gsap.set([...revealItems, ...evidenceItems], { opacity: 1, x: 0, y: 0, scale: 1 })
            return
          }

          gsap.set(revealItems, { opacity: 0, y: 22, scale: 0.985 })
          gsap.to(revealItems, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.08,
          })

          if (evidenceItems.length) {
            gsap.fromTo(
              evidenceItems,
              { opacity: 0, x: 18 },
              { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.05 }
            )
          }
        }
      )

      return () => mm.revert()
    },
    { scope: slideRef, dependencies: [index, showEvidence] }
  )

  const go = useCallback(
    (nextIndex: number) => {
      const safeIndex = Math.max(0, Math.min(total - 1, nextIndex))
      setShowEvidence(shouldShowEvidenceByDefault(slides[safeIndex]))
      setIndex(safeIndex)
    },
    [slides, total]
  )

  const next = useCallback(() => go(index + 1), [go, index])
  const prev = useCallback(() => go(index - 1), [go, index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prev()
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen()
      } else if (e.key.toLowerCase() === 'e') {
        setShowEvidence((value) => !value)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next, prev])

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => null)
    } else {
      document.exitFullscreen?.().catch(() => null)
    }
  }, [])

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const summaryText = useMemo(() => {
    return [
      deckLabel,
      '',
      summary,
      '',
      'Current slide:',
      `${index + 1}. ${slide.title}`,
    ].join('\n')
  }, [deckLabel, index, slide.title, summary])

  const copySummary = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(summaryText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }, [summaryText])

  const hasEvidence = Boolean(slide.evidence?.length)

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex flex-col overflow-hidden bg-[#070806] text-stone-50',
        isFullscreen ? 'h-screen' : 'h-[calc(100vh-4.25rem)] min-h-[620px]'
      )}
    >
      <BriefingBackdrop />

      <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-black/35 px-4 py-2.5 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/content/testing/dashboard" className="text-stone-400 transition hover:text-stone-50" aria-label="Back to dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Badge variant="outline" className={cn('shrink-0', SECTION_STYLES[slide.section])}>
            {slide.section}
          </Badge>
          <span className="truncate text-sm text-stone-400">
            {deckLabel} · {index + 1} of {total}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEvidence((value) => !value)}
            disabled={!hasEvidence}
            className="border-white/15 bg-white/5 text-stone-100 hover:bg-white/10"
            title="Toggle evidence cards (e)"
          >
            {showEvidence ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="ml-1.5 hidden sm:inline">Evidence</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copySummary}
            className="border-white/15 bg-white/5 text-stone-100 hover:bg-white/10"
            title="Copy deck summary"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="border-white/15 bg-white/5 text-stone-100 hover:bg-white/10"
            title="Toggle fullscreen (f)"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      <div className="relative z-10 h-1 w-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/70 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <main className="relative z-10 grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_104px]">
        <section className="min-h-0 overflow-hidden">
          <div ref={slideRef} className="h-full min-h-0">
            <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl items-stretch px-5 py-4 sm:px-7 lg:px-10 lg:py-5">
              <SlideContent slide={slide} showEvidence={showEvidence} />
            </div>
          </div>
        </section>

        <SectionRail slides={slides} currentIndex={index} onSelect={go} />
      </main>

      <footer className="relative z-10 flex shrink-0 items-center justify-between gap-4 border-t border-white/10 bg-black/35 px-4 py-2.5 backdrop-blur-xl">
        <Button
          variant="outline"
          onClick={prev}
          disabled={index === 0}
          className="min-w-28 border-white/15 bg-white/5 text-stone-100 hover:bg-white/10"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>

        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {slides.map((item, slideIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(slideIndex)}
              aria-label={`Go to ${item.title}`}
              title={item.title}
              className={cn(
                'h-1.5 rounded-full transition-all',
                slideIndex === index
                  ? 'w-12 bg-gold'
                  : slideIndex < index
                    ? 'w-5 bg-primary/45 hover:bg-primary/70'
                    : 'w-5 bg-white/20 hover:bg-white/35'
              )}
            />
          ))}
        </div>

        <Button
          onClick={next}
          disabled={index === total - 1}
          className="min-w-28 bg-gold text-primary-foreground hover:bg-primary/85"
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </footer>
    </div>
  )
}

export function QaInsightsDeckPrint({
  slides = QA_INSIGHTS_SLIDES,
  deckLabel = 'QA Insights Deck',
}: {
  slides?: QaInsightsSlide[]
  deckLabel?: string
}) {
  return (
    <div className="min-h-screen bg-[#070806] px-4 py-6 text-stone-50 print:bg-[#070806] print:p-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: 16in 9in;
              margin: 0;
            }

            @media print {
              body > nav,
              body nav.border-b,
              body nav[class*="border-b"] {
                display: none !important;
              }

              html,
              body {
                width: 16in;
                min-height: 9in;
                background: #070806 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }

              .deck-print-toolbar {
                display: none !important;
              }

              .deck-print-slide {
                width: 16in !important;
                height: 9in !important;
                margin: 0 !important;
                break-after: page;
                page-break-after: always;
                box-shadow: none !important;
              }

              .deck-print-slide:last-child {
                break-after: auto;
                page-break-after: auto;
              }
            }
          `,
        }}
      />

      <div className="deck-print-toolbar mx-auto mb-6 flex max-w-7xl items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Print export</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{deckLabel}</h1>
          <p className="mt-1 text-sm text-stone-400">
            Use Cmd+P, choose landscape if prompted, then Save as PDF. Each slide is rendered as its own page.
          </p>
        </div>
        <Button onClick={() => window.print()} className="bg-gold text-primary-foreground hover:bg-primary/85">
          Print / Save PDF
        </Button>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 print:block print:max-w-none print:gap-0">
        {slides.map((slide, index) => (
          <section
            key={slide.id}
            className="deck-print-slide relative mx-auto flex aspect-video w-full overflow-hidden rounded-3xl bg-[#070806] text-stone-50 shadow-2xl shadow-black/35 print:rounded-none"
          >
            <BriefingBackdrop />
            <div className="relative z-10 flex h-full min-h-0 w-full flex-col">
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black/25 px-6 py-2.5">
                <Badge variant="outline" className={cn('shrink-0', SECTION_STYLES[slide.section])}>
                  {slide.section}
                </Badge>
                <span className="text-xs text-stone-500">
                  {index + 1} / {slides.length}
                </span>
              </div>
              <div className="min-h-0 flex-1 px-10 py-5">
                <SlideContent slide={slide} showEvidence />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export function QaInsightsDeckFigmaExport({
  slides = QA_INSIGHTS_SLIDES,
}: {
  slides?: QaInsightsSlide[]
}) {
  return (
    <main className="min-h-screen bg-[#070806] p-0 text-stone-50">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            html,
            body {
              background: #070806 !important;
            }

            body > nav,
            body nav.border-b,
            body nav[class*="border-b"] {
              display: none !important;
            }

            .figma-deck-frame {
              width: 1600px;
              height: 900px;
            }
          `,
        }}
      />

      <div className="flex flex-col items-start gap-0 bg-[#070806]">
        {slides.map((slide) => (
          <section
            key={slide.id}
            data-figma-frame
            data-slide-id={slide.id}
            data-slide-title={slide.title}
            className="figma-deck-frame relative flex shrink-0 overflow-hidden bg-[#070806] text-stone-50"
          >
            <BriefingBackdrop />
            <div className="relative z-10 h-full min-h-0 w-full px-16 py-12">
              <SlideContent slide={slide} showEvidence />
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}

function BriefingBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(120,140,73,0.28),transparent_32%),radial-gradient(circle_at_78%_14%,rgba(213,197,120,0.16),transparent_30%),linear-gradient(135deg,#070806_0%,#12150d_48%,#050604_100%)]" />
      <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute -left-32 top-20 z-[1] h-96 w-96 rounded-full border border-primary/20 bg-primary/[0.015] opacity-60" />
      <div className="absolute bottom-12 right-16 h-64 w-64 rounded-full border border-white/10 opacity-60" />
    </div>
  )
}

function SlideContent({ slide, showEvidence }: { slide: QaInsightsSlide; showEvidence: boolean }) {
  const hasCompactStatsBullets = slide.id === 'what-we-did' && Boolean(slide.stats && slide.bullets)
  const hasThemeStats = slide.visual === 'themeCards' && Boolean(slide.themes && slide.stats && !slide.evidence)
  const hasTopBulletPanel = slide.id === 'context-goal-method' && Boolean(slide.bullets)

  return (
    <div className="flex h-full min-h-0 w-full flex-col justify-start gap-3 overflow-hidden pt-5 lg:pt-6">
      <div className="deck-reveal max-w-5xl shrink-0 space-y-2.5">
        {slide.eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold">
            {slide.eyebrow}
          </p>
        )}
        <h1 className="max-w-5xl text-3xl font-semibold tracking-[-0.04em] text-stone-50 sm:text-4xl lg:text-[2.65rem]">
          {slide.title}
        </h1>
        {slide.subtitle && (
          <p className="max-w-3xl text-sm leading-6 text-stone-300">
            {slide.subtitle}
          </p>
        )}
        {slide.body && slide.visual !== 'hero' && slide.visual !== 'themeCards' && (
          <p className="max-w-4xl text-sm leading-5 text-stone-300">
            {slide.body}
          </p>
        )}
      </div>

      <div className={cn('min-h-0 shrink overflow-hidden', slide.section === 'Themes' && 'pt-3 lg:pt-4')}>
        <div className="flex h-full min-h-0 flex-col justify-center gap-3 overflow-hidden">
          {slide.visual === 'hero' && <HeroSignal slide={slide} />}
          {slide.visual === 'executiveSummary' && slide.bullets && (
            <ExecutiveSummaryVisual bullets={slide.bullets} />
          )}
          {hasCompactStatsBullets && slide.stats && slide.bullets && (
            <CompactStatsBullets stats={slide.stats} bullets={slide.bullets} />
          )}
          {hasTopBulletPanel && slide.bullets && <OpeningContextCards bullets={slide.bullets} />}
          {!hasCompactStatsBullets &&
            slide.stats &&
            !hasTopBulletPanel &&
            !hasThemeStats &&
            slide.visual !== 'hero' &&
            slide.visual !== 'executiveSummary' &&
            slide.visual !== 'contentGapMap' && (
            <StatsGrid stats={slide.stats} />
          )}
          {hasTopBulletPanel && slide.stats && <OpeningStatsStrip stats={slide.stats} />}
          {hasTopBulletPanel && slide.themeSignals && <OpeningSentimentChart signals={slide.themeSignals} />}
          {!hasCompactStatsBullets &&
            slide.bullets &&
            !hasTopBulletPanel &&
            slide.visual !== 'executiveSummary' &&
            slide.visual !== 'contentGapMap' && <BulletPanel bullets={slide.bullets} />}
          {slide.visual === 'themeIndex' && slide.themes && <ThemeIndex themes={slide.themes} />}
          {slide.visual === 'themeData' && slide.themeSignals && slide.issueClusters && (
            <ThemeData signals={slide.themeSignals} issueClusters={slide.issueClusters} />
          )}
          {slide.visual === 'contentGapMap' && slide.bullets && slide.evidence && (
            <ContentGapMap bullets={slide.bullets} evidence={slide.evidence} />
          )}
          {slide.visual === 'contentGapAnalysis' && slide.risks && (
            <ContentGapAnalysisChart risks={slide.risks} />
          )}
          {slide.visual === 'deepDiveMatrix' && slide.deepDive && (
            <DeepDiveMatrix deepDive={slide.deepDive} />
          )}
          {slide.visual === 'themeCards' && slide.themes && slide.evidence && showEvidence && (
            <ThemeDetailWithEvidence themes={slide.themes} evidence={slide.evidence} />
          )}
          {hasThemeStats && slide.themes && slide.stats && (
            <ThemeFindingWithMetrics themes={slide.themes} stats={slide.stats} />
          )}
          {slide.visual !== 'themeIndex' && !hasThemeStats && !(slide.visual === 'themeCards' && slide.evidence && showEvidence) && slide.themes && (
            <ThemeGrid themes={slide.themes} />
          )}
          {slide.risks && slide.visual !== 'contentGapAnalysis' && <RiskMatrix risks={slide.risks} />}
          {slide.recommendations && slide.visual === 'answerModel' && (
            <AnswerModel recommendations={slide.recommendations} />
          )}
          {slide.recommendations && slide.visual !== 'answerModel' && (
            <RecommendationList recommendations={slide.recommendations} />
          )}
          {slide.roadmap && <Roadmap columns={slide.roadmap} />}
          {showEvidence && slide.evidence && !(slide.visual === 'themeCards' && slide.themes) && (
            <EvidenceGrid evidence={slide.evidence} />
          )}
        </div>
      </div>
    </div>
  )
}

function ExecutiveSummaryVisual({
  bullets,
}: {
  bullets: string[]
}) {
  return (
    <div className="min-h-0 space-y-3">
      <div className="grid min-h-0 gap-3 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="deck-reveal rounded-3xl border border-primary/20 bg-primary/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Trust equation</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {['Direct answer', 'Official source', 'Relevant voice', 'Next step'].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-semibold text-stone-100">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-200">
            The concept works when Army Answers behaves like a decision guide: direct, sourced, human, and action-oriented.
          </p>
        </div>

        <div className="deck-reveal rounded-3xl border border-white/10 bg-black/25 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-gold">What this means</p>
          <div className="grid gap-2">
            {bullets.map((bullet) => (
              <div key={bullet} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5">
                <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <p className="text-xs leading-5 text-stone-200 sm:text-sm">{bullet}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

function CompactStatsBullets({ stats, bullets }: { stats: QaInsightStat[]; bullets: string[] }) {
  return (
    <div className="grid min-h-0 gap-3 lg:grid-cols-[1fr_0.95fr]">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {stats.map((stat) => (
          <div
            key={`${stat.label}-${stat.value}`}
            className="deck-reveal rounded-2xl border border-white/10 bg-white/[0.045] p-3 backdrop-blur"
          >
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500">{stat.label}</div>
            <div className="mt-1.5 text-2xl font-semibold tracking-tight text-gold">{stat.value}</div>
            {stat.note && <p className="mt-1.5 text-xs leading-4 text-stone-300">{stat.note}</p>}
          </div>
        ))}
      </div>

      <div className="deck-reveal rounded-3xl border border-white/10 bg-black/25 p-3">
        <div className="grid gap-2">
          {bullets.map((bullet) => (
            <div key={bullet} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              <p className="text-xs leading-5 text-stone-200 sm:text-sm">{bullet}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ThemeDetailWithEvidence({
  themes,
  evidence,
}: {
  themes: QaInsightTheme[]
  evidence: QaEvidenceItem[]
}) {
  const theme = themes[0]

  if (!theme) return null

  return (
    <div className="grid min-h-0 gap-3 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="deck-reveal rounded-3xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur">
        <div className="space-y-2.5">
          <ThemeRow label="Finding" text={theme.finding} />
          <ThemeRow label="Implication" text={theme.implication} />
          <ThemeRow label="Recommendation" text={theme.recommendation} />
        </div>
      </div>

      <div className="deck-reveal rounded-3xl border border-primary/20 bg-primary/10 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-gold">
          <AlertTriangle className="h-4 w-4" />
          Evidence
        </div>
        <div className="grid gap-3">
          {evidence.map((item, index) => (
            <div key={`${item.participant}-${index}`} className="evidence-reveal rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
                {item.participant ?? 'Evidence'}
              </p>
              <p className="mt-2 text-sm leading-5 text-stone-100">{item.quote}</p>
              {item.context && <p className="mt-2 text-xs leading-5 text-stone-400">{item.context}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ThemeIndex({ themes }: { themes: QaInsightTheme[] }) {
  return (
    <div className="deck-reveal grid min-h-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {themes.map((theme, index) => {
        const Icon = ICONS[index % ICONS.length]
        return (
          <div key={theme.title} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-gold">
                {theme.label}
              </Badge>
              <Icon className="h-5 w-5 shrink-0 text-gold" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold leading-tight text-stone-50">{theme.title}</h3>
            <p className="mt-4 text-sm leading-6 text-stone-300">{theme.finding}</p>
          </div>
        )
      })}
    </div>
  )
}

function ThemeData({
  signals,
  issueClusters,
}: {
  signals: QaThemeSignal[]
  issueClusters: QaThemeIssueCluster[]
}) {
  return (
    <div className="grid min-h-0 gap-3 lg:grid-cols-[1.05fr_0.95fr]">
      <IssueClusterChart clusters={issueClusters} />
      <SignalChart signals={signals} />
    </div>
  )
}

function ContentGapMap({
  bullets,
  evidence,
}: {
  bullets: string[]
  evidence: QaEvidenceItem[]
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const steps = [
    { label: 'Missing Basic Training baseline', icon: FileText },
    { label: 'Generic pay specificity', icon: BarChart3 },
    { label: 'Overweighted retirement frame', icon: Layers3 },
    { label: 'Unclear career pathways', icon: Route },
  ]

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { motion } = ctx.conditions as { motion: boolean }
          const icons = gsap.utils.toArray<HTMLElement>('.gap-icon')

          if (!motion) {
            gsap.set(icons, { opacity: 1, scale: 1, x: 0 })
            return
          }

          gsap.fromTo(
            icons,
            { opacity: 0, scale: 0.82, y: 8 },
            { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: 'back.out(1.8)', stagger: 0.08, delay: 0.25 }
          )
        }
      )

      return () => mm.revert()
    },
    { scope: rootRef, dependencies: [bullets, evidence] }
  )

  return (
    <div ref={rootRef} className="grid min-h-0 gap-3 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="deck-reveal rounded-3xl border border-primary/20 bg-primary/10 p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {steps.map((step, index) => {
            const Icon = step.icon
            const detail = bullets[index]

            return (
              <div key={step.label} className="gap-icon rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 shrink-0 text-gold" />
                  <p className="text-sm font-semibold leading-5 text-stone-100">{step.label}</p>
                </div>
                {detail && <p className="mt-2 text-xs leading-5 text-stone-300">{detail}</p>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid min-h-0 gap-3">
        <div className="deck-reveal rounded-3xl border border-white/10 bg-black/25 p-2.5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.26em] text-gold">Evidence receipts</p>
          <div className="grid gap-2">
            {evidence.slice(0, 3).map((item) => (
              <div key={item.participant} className="rounded-2xl border border-white/10 bg-white/[0.035] p-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">{item.participant}</p>
                <p className="mt-1 text-[11px] leading-4 text-stone-300">{item.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ContentGapAnalysisChart({ risks }: { risks: QaRiskItem[] }) {
  const total = risks.length
  const criticalCount = risks.filter((risk) => risk.severity === 'Critical').length
  const highCount = risks.filter((risk) => risk.severity === 'High').length
  const bars = [
    { label: 'Critical', value: criticalCount, tone: 'bg-red-300' },
    { label: 'High', value: highCount, tone: 'bg-gold' },
  ]

  return (
    <div className="grid min-h-0 gap-3 lg:grid-cols-[0.7fr_1.3fr]">
      <div className="grid min-h-0 content-start gap-2.5">
        <div className="deck-reveal rounded-2xl border border-primary/20 bg-primary/10 p-2.5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">Gap severity</p>
              <p className="mt-0.5 text-[10px] leading-3 text-stone-400">
                8 highest-priority discrepancies from the GoArmy.com content gap analysis.
              </p>
            </div>
            <BarChart3 className="h-4 w-4 shrink-0 text-gold" />
          </div>
          <div className="space-y-2">
            {bars.map((bar) => {
              const pct = total > 0 ? Math.round((bar.value / total) * 100) : 0

              return (
                <div key={bar.label}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-stone-100">{bar.label}</span>
                    <span className="text-base font-semibold text-gold">{bar.value}/{total}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className={cn('h-full rounded-full', bar.tone)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="deck-reveal rounded-2xl border border-white/10 bg-black/25 p-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">Coverage baseline</p>
          <p className="mt-1.5 text-xs leading-4 text-stone-200">
            GoArmy.com already covers Explore / Why the Army, Army Life, Careers & Jobs, Benefits, and How to Join.
          </p>
          <p className="mt-1.5 text-[11px] leading-4 text-stone-400">
            The documented gap is retrieval, prioritization, citation, and answer structure, not simply missing site content.
          </p>
        </div>
      </div>

      <div className="deck-reveal rounded-3xl border border-white/10 bg-white/[0.045] p-3 backdrop-blur">
        <div className="grid gap-2 sm:grid-cols-2">
          {risks.map((risk, index) => (
            <div key={risk.area} className="rounded-2xl border border-white/10 bg-black/20 p-2.5 lg:p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold leading-tight text-stone-100 xl:text-[13px]">
                  {index + 1}. {risk.area}
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    'shrink-0 border-white/15 px-1.5 py-0 text-[9px]',
                    risk.severity === 'Critical' ? 'bg-red-400/15 text-red-100' : 'bg-gold/15 text-gold'
                  )}
                >
                  {risk.severity}
                </Badge>
              </div>
              <p className="overflow-hidden text-[11px] leading-4 text-stone-300 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] xl:text-xs xl:leading-4">
                {risk.issue}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DeepDiveMatrix({ deepDive }: { deepDive: NonNullable<QaInsightsSlide['deepDive']> }) {
  return (
    <div className="grid min-h-0 gap-2 lg:grid-cols-[1.42fr_0.58fr]">
      <div className="deck-reveal rounded-3xl border border-white/10 bg-white/[0.045] p-2.5 backdrop-blur">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold">{deepDive.type} matrix</p>
            <p className="mt-0.5 text-[11px] leading-3.5 text-stone-400">{deepDive.goal}</p>
          </div>
          <Layers3 className="h-4 w-4 shrink-0 text-gold" />
        </div>

        <div className="grid gap-1">
          <div className="grid grid-cols-[1.08fr_0.8fr_0.86fr_0.44fr] gap-1.5 rounded-2xl border border-white/10 bg-black/30 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-gold">
            <span>Example Q/A</span>
            <span>Evidence</span>
            <span>Why it matters</span>
            <span>Screenshot</span>
          </div>

          {deepDive.examples.map((example) => (
            <div
              key={`${example.label}-${example.prompt}`}
              className="grid grid-cols-[1.08fr_0.8fr_0.86fr_0.44fr] gap-1.5 rounded-2xl border border-white/10 bg-black/20 p-1.5"
            >
              <div>
                <p className="text-[11px] font-semibold text-stone-50">{example.label}</p>
                <div className="mt-1 space-y-1">
                  <p className="text-[9px] leading-3 text-stone-300">
                    <span className="font-semibold uppercase tracking-[0.14em] text-gold">Q: </span>
                    {example.prompt}
                  </p>
                  {example.answer && (
                    <p className="text-[9px] leading-3 text-stone-400">
                      <span className="font-semibold uppercase tracking-[0.14em] text-gold">A: </span>
                      {example.answer}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[10px] leading-3.5 text-stone-200">{example.evidence}</p>
              <p className="text-[10px] leading-3.5 text-stone-300">{example.takeaway}</p>
              <p className="text-[8px] font-semibold uppercase leading-3 tracking-[0.1em] text-gold">{example.screenshots}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 content-start gap-2">
        <DeepDiveSideCard title="Screenshots to use" items={deepDive.screenshots} icon="screens" />
        <DeepDiveSideCard title="Issue recall" items={deepDive.issueRecall} icon="issues" />
        <DeepDiveSideCard title="Presenter notes" items={deepDive.presenterNotes} icon="notes" />
      </div>
    </div>
  )
}

function DeepDiveSideCard({
  title,
  items,
  icon,
}: {
  title: string
  items: string[]
  icon: 'screens' | 'issues' | 'notes'
}) {
  const Icon = icon === 'screens' ? FileText : icon === 'issues' ? AlertTriangle : MessageSquareQuote

  return (
    <div className="deck-reveal rounded-2xl border border-primary/20 bg-primary/10 p-2">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">{title}</p>
        <Icon className="h-3.5 w-3.5 shrink-0 text-gold" />
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item} className="flex gap-1.5 rounded-xl border border-white/10 bg-black/20 p-1.5">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
            <p className="text-[9px] leading-3 text-stone-300">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function IssueClusterChart({ clusters }: { clusters: QaThemeIssueCluster[] }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const total = clusters.reduce((sum, cluster) => sum + cluster.value, 0)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { motion } = ctx.conditions as { motion: boolean }
          const bars = gsap.utils.toArray<HTMLElement>('.issue-cluster-bar')

          if (!motion) {
            gsap.set(bars, { scaleX: 1 })
            return
          }

          gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' })
          gsap.to(bars, {
            scaleX: 1,
            duration: 0.8,
            ease: 'power3.out',
            delay: 1,
            stagger: 0.08,
          })
        }
      )

      return () => mm.revert()
    },
    { scope: rootRef, dependencies: [clusters] }
  )

  return (
    <div ref={rootRef} className="deck-reveal rounded-3xl border border-white/10 bg-black/25 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Issue clusters</p>
          <p className="mt-1 text-xs leading-5 text-stone-400">
            41 prompt evaluations produced {total} issue tags. Higher bars mean more observed gaps.
          </p>
        </div>
        <BarChart3 className="h-5 w-5 shrink-0 text-gold" />
      </div>
      <div className="space-y-2.5">
        {clusters.map((cluster) => {
          const pct = total > 0 ? Math.round((cluster.value / total) * 100) : 0
          const width = pct > 0 ? Math.max(6, pct) : 0

          return (
            <div key={cluster.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-stone-200">{cluster.label}</span>
                <span className="font-semibold text-gold">{cluster.value} tags · {pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`issue-cluster-bar ${DATA_BAR_FILL_CLASS}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] leading-4 text-stone-400">
                {cluster.note}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SignalChart({ signals }: { signals: QaThemeSignal[] }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { motion } = ctx.conditions as { motion: boolean }
          const bars = gsap.utils.toArray<HTMLElement>('.signal-bar')
          const numbers = gsap.utils.toArray<HTMLElement>('.signal-number')

          if (!motion) {
            gsap.set(bars, { scaleX: 1 })
            numbers.forEach((number) => {
              number.textContent = `${number.dataset.value ?? '0'}%`
            })
            return
          }

          gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' })
          gsap.to(bars, {
            scaleX: 1,
            duration: 0.75,
            ease: 'power3.out',
            delay: 1,
            stagger: 0.08,
          })

          numbers.forEach((number, index) => {
            const value = Number(number.dataset.value ?? 0)
            const counter = { value: 0 }
            number.textContent = '0%'
            gsap.to(counter, {
              value,
              duration: 0.85,
              ease: 'power3.out',
              delay: 1 + index * 0.06,
              onUpdate: () => {
                number.textContent = `${Math.round(counter.value)}%`
              },
            })
          })
        }
      )

      return () => mm.revert()
    },
    { scope: rootRef, dependencies: [signals] }
  )

  return (
    <div ref={rootRef} className="deck-reveal grid gap-2.5 sm:grid-cols-2">
      {signals.map((signal) => {
        const pct = signal.total > 0 ? Math.round((signal.value / signal.total) * 100) : 0
        return (
          <div key={signal.label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="max-w-40 text-xs font-semibold uppercase tracking-[0.18em] text-stone-300">{signal.label}</p>
              <span className="signal-number text-2xl font-semibold text-gold" data-value={pct}>
                {pct}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className={`signal-bar ${DATA_BAR_FILL_CLASS}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs leading-5 text-stone-300">
              {signal.value}/{signal.total} · {signal.note}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function HeroSignal({ slide }: { slide: QaInsightsSlide }) {
  const heroStat = slide.stats?.[0]
  const heroMessage =
    slide.body ??
    heroStat?.note ??
    'Answer directly. Show the source. Use human stories selectively. Route users to the next best step.'

  return (
    <div className="deck-reveal grid min-h-0 gap-3 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.3em] text-stone-500">
            {heroStat?.label ?? 'Strategic frame'}
          </span>
          <ShieldCheck className="h-5 w-5 text-gold" />
        </div>
        <p className="max-w-2xl text-xl leading-tight text-stone-100 sm:text-2xl">
          {heroMessage}
        </p>
        {heroStat?.value && (
          <p className="mt-5 text-2xl font-semibold tracking-tight text-gold">{heroStat.value}</p>
        )}
      </div>
      <div className="relative min-h-44 overflow-hidden rounded-3xl border border-primary/20 bg-primary/10 p-5">
        <div className="absolute inset-6 rounded-full border border-primary/20" />
        <div className="absolute inset-14 rounded-full border border-primary/15" />
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold" />
        <div className="absolute inset-x-8 top-1/2 h-px bg-primary/30" />
        <div className="absolute inset-y-8 left-1/2 w-px bg-primary/30" />
        <div className="relative z-10 flex h-full flex-col justify-end">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">North star</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">Trusted guide</p>
        </div>
      </div>
    </div>
  )
}

function StatsGrid({ stats }: { stats: QaInsightStat[] }) {
  return (
    <div className={cn('grid gap-3', stats.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-4')}>
      {stats.map((stat) => (
        <div
          key={`${stat.label}-${stat.value}`}
          className={cn('deck-reveal rounded-2xl border border-white/10 bg-white/[0.045] backdrop-blur', stats.length === 3 ? 'p-3' : 'p-4')}
        >
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">{stat.label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-gold">{stat.value}</div>
          {stat.note && <p className="mt-2 text-xs leading-5 text-stone-300">{stat.note}</p>}
        </div>
      ))}
    </div>
  )
}

function BulletPanel({ bullets }: { bullets: string[] }) {
  return (
    <div className="deck-reveal rounded-3xl border border-white/10 bg-black/25 p-4">
      <div className={cn('grid gap-2.5', bullets.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
        {bullets.map((bullet) => (
          <div key={bullet} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
            <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
            <p className="text-xs leading-5 text-stone-200 sm:text-sm">{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function OpeningSentimentChart({ signals }: { signals: QaThemeSignal[] }) {
  return (
    <div className="deck-reveal rounded-3xl border border-primary/20 bg-primary/10 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-3 px-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">General sentiment</p>
          <p className="mt-0.5 text-[11px] leading-4 text-stone-400">
            Qualitative summary from participant records. Readiness is used as an expectations-met proxy, not a 1-5 rating.
          </p>
        </div>
        <BarChart3 className="h-5 w-5 shrink-0 text-gold" />
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {signals.map((signal) => {
          const pct = signal.total > 0 ? Math.round((signal.value / signal.total) * 100) : 0

          return (
            <div key={signal.label} className="rounded-2xl border border-white/10 bg-black/20 p-2">
              <div className="grid grid-cols-[64px_1fr] items-center gap-3">
                <span className="text-left text-2xl font-semibold text-gold">{pct}%</span>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">{signal.label}</p>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={DATA_BAR_FILL_CLASS} style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-[10px] leading-3 text-stone-300">
                {signal.value}/{signal.total} · {signal.note}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OpeningContextCards({ bullets }: { bullets: string[] }) {
  return (
    <div className="deck-reveal grid gap-2.5 md:grid-cols-3">
      {bullets.map((bullet) => {
        const [rawTitle, ...descriptionParts] = bullet.split(':')
        const title = rawTitle.trim()
        const description = descriptionParts.join(':').trim()

        return (
          <div key={bullet} className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">{title}</p>
            <p className="mt-2 text-xs leading-5 text-stone-200 sm:text-sm">{description || bullet}</p>
          </div>
        )
      })}
    </div>
  )
}

function OpeningStatsStrip({ stats }: { stats: QaInsightStat[] }) {
  return (
    <div className="grid gap-2.5 md:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={`${stat.label}-${stat.value}`}
          className="deck-reveal rounded-2xl border border-white/10 bg-white/[0.045] p-2.5 backdrop-blur"
        >
          <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-stone-500">{stat.label}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-gold">{stat.value}</div>
          {stat.note && <p className="mt-1 text-[11px] leading-4 text-stone-300">{stat.note}</p>}
        </div>
      ))}
    </div>
  )
}

function ThemeGrid({ themes }: { themes: QaInsightTheme[] }) {
  return (
    <div className={cn('grid gap-3', themes.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2')}>
      {themes.map((theme, index) => {
        const Icon = ICONS[index % ICONS.length]
        return (
          <div
            key={theme.title}
            className="deck-reveal rounded-3xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur"
          >
            <div className="mb-3 flex items-center justify-between">
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-gold">
                {theme.label}
              </Badge>
              <Icon className="h-5 w-5 text-gold" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight">{theme.title}</h3>
            <div className="mt-3 space-y-2.5">
              <ThemeRow label="Finding" text={theme.finding} />
              <ThemeRow label="Implication" text={theme.implication} />
              <ThemeRow label="Recommendation" text={theme.recommendation} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ThemeFindingWithMetrics({ themes, stats }: { themes: QaInsightTheme[]; stats: QaInsightStat[] }) {
  const theme = themes[0]
  const standaloneMax = Math.max(
    1,
    ...stats
      .map((stat) => Number.parseFloat(stat.value))
      .filter((value) => Number.isFinite(value))
  )

  if (!theme) return null

  return (
    <div className="grid min-h-0 gap-3 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="deck-reveal rounded-3xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Theme readout</p>
          <FileText className="h-5 w-5 shrink-0 text-gold" />
        </div>
        <div className="space-y-2.5">
          <ThemeRow label="Finding" text={theme.finding} />
          <ThemeRow label="Implication" text={theme.implication} />
          <ThemeRow label="Recommendation" text={theme.recommendation} />
        </div>
      </div>

      <div className="deck-reveal rounded-3xl border border-primary/20 bg-primary/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Signals</p>
        <div className="mt-3 space-y-3">
          {stats.map((stat) => {
            const pct = getMetricPercent(stat.value, standaloneMax)

            return (
              <div key={`${stat.label}-${stat.value}`} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="grid grid-cols-[auto_1fr] items-center gap-4">
                  <span className="min-w-9 shrink-0 text-center text-4xl font-semibold tracking-tight text-gold">{stat.value}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">{stat.label}</p>
                    {stat.note && <p className="mt-1 text-xs leading-4 text-stone-300">{stat.note}</p>}
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className={DATA_BAR_FILL_CLASS} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function getMetricPercent(value: string, standaloneMax: number) {
  const ratioMatch = value.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/)

  if (ratioMatch) {
    const numerator = Number.parseFloat(ratioMatch[1])
    const denominator = Number.parseFloat(ratioMatch[2])
    return denominator > 0 ? Math.max(4, Math.min(100, (numerator / denominator) * 100)) : 0
  }

  const numericValue = Number.parseFloat(value)
  return Number.isFinite(numericValue) ? Math.max(4, Math.min(100, (numericValue / standaloneMax) * 100)) : 0
}

function ThemeRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-gold/80">{label}</div>
      <p className="mt-1.5 text-xs leading-5 text-stone-200 sm:text-sm">{text}</p>
    </div>
  )
}

function RiskMatrix({ risks }: { risks: QaRiskItem[] }) {
  const isSplitRiskSlide = risks.length <= 3

  return (
    <div className={cn('grid', isSplitRiskSlide ? 'gap-4 lg:grid-cols-3' : 'gap-2 lg:grid-cols-3')}>
      {risks.map((risk) => (
        <div
          key={risk.area}
          className={cn(
            'deck-reveal relative rounded-2xl border border-white/10 bg-white/[0.035]',
            isSplitRiskSlide ? 'p-4' : 'p-2.5'
          )}
        >
          <div
            className={cn(
              'flex justify-between gap-3',
              isSplitRiskSlide ? 'mb-4 h-16 items-start' : 'mb-2 items-center'
            )}
          >
            <h3 className={cn('font-semibold leading-tight text-stone-50', isSplitRiskSlide ? 'text-2xl' : 'text-sm')}>
              {risk.area}
            </h3>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0',
                isSplitRiskSlide ? 'px-2.5 py-1 text-xs' : 'px-2 py-0 text-[10px]',
                risk.severity === 'Critical'
                  ? 'border-red-400/35 bg-red-400/10 text-red-100'
                  : 'border-amber-400/35 bg-amber-400/10 text-amber-100'
              )}
            >
              {risk.severity}
            </Badge>
          </div>

          <div className={cn(isSplitRiskSlide ? 'space-y-4' : 'space-y-1.5')}>
            <div className={cn(isSplitRiskSlide && 'h-32')}>
              <p
                className={cn(
                  'font-semibold uppercase text-stone-500',
                  isSplitRiskSlide ? 'text-xs tracking-[0.22em]' : 'text-[9px] tracking-[0.18em]'
                )}
              >
                Issue
              </p>
              <p className={cn('text-stone-300', isSplitRiskSlide ? 'mt-2 text-sm leading-6' : 'mt-0.5 text-[11px] leading-4')}>
                {risk.issue}
              </p>
            </div>
            <div className={cn('rounded-xl border border-primary/20 bg-primary/10', isSplitRiskSlide ? 'h-36 p-3' : 'p-2')}>
              <p
                className={cn(
                  'font-semibold uppercase text-gold',
                  isSplitRiskSlide ? 'text-xs tracking-[0.22em]' : 'text-[9px] tracking-[0.18em]'
                )}
              >
                Recommendation
              </p>
              <p className={cn('text-stone-100', isSplitRiskSlide ? 'mt-2 text-sm leading-6' : 'mt-0.5 text-[11px] leading-4')}>
                {risk.recommendation}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function AnswerModel({ recommendations }: { recommendations: string[] }) {
  return (
    <div className="deck-reveal grid gap-2.5 lg:grid-cols-5">
      {recommendations.map((item, index) => (
        <div key={item} className="relative rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-full bg-gold text-sm font-bold text-primary-foreground">
            {index + 1}
          </div>
          <p className="text-base font-semibold leading-tight">{item}</p>
          {index < recommendations.length - 1 && (
            <ChevronRight className="absolute -right-5 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-primary/60 lg:block" />
          )}
        </div>
      ))}
    </div>
  )
}

function RecommendationList({ recommendations }: { recommendations: string[] }) {
  return (
    <div className="deck-reveal grid gap-2.5 md:grid-cols-2">
      {recommendations.map((item) => (
        <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
          <Compass className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <p className="text-xs leading-5 text-stone-200 sm:text-sm">{item}</p>
        </div>
      ))}
    </div>
  )
}

function Roadmap({ columns }: { columns: QaRoadmapColumn[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {columns.map((column) => (
        <div key={column.label} className="deck-reveal rounded-3xl border border-white/10 bg-white/[0.045] p-4">
          <div className="mb-3 flex items-center justify-between">
            <Badge className="bg-gold text-primary-foreground">{column.label}</Badge>
            <Layers3 className="h-5 w-5 text-gold" />
          </div>
          <h3 className="text-xl font-semibold">{column.title}</h3>
          <ul className="mt-3 space-y-2">
            {column.items.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-stone-300">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function EvidenceGrid({ evidence }: { evidence: QaEvidenceItem[] }) {
  return (
    <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
      {evidence.map((item, index) => (
        <div key={`${item.participant}-${index}`} className="evidence-reveal rounded-2xl border border-primary/20 bg-primary/10 p-3">
          {item.title && (
            <div className="mb-3 rounded-xl border border-primary/25 bg-primary/15 p-2.5">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Insight</div>
              <h3 className="text-base font-semibold leading-tight text-stone-50">{item.title}</h3>
            </div>
          )}
          {item.participant && (
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
              <AlertTriangle className="h-3.5 w-3.5" />
              {item.participant}
            </div>
          )}
          <p className="text-xs font-medium leading-4 text-stone-100 sm:text-[13px]">{item.quote}</p>
          {item.context && <p className="mt-1.5 text-[11px] leading-4 text-stone-400 sm:text-xs">{item.context}</p>}
        </div>
      ))}
    </div>
  )
}

function SectionRail({
  slides,
  currentIndex,
  onSelect,
}: {
  slides: QaInsightsSlide[]
  currentIndex: number
  onSelect: (index: number) => void
}) {
  return (
    <aside className="hidden border-l border-white/10 bg-black/25 px-3 py-5 lg:block">
      <div className="flex h-full flex-col items-center justify-between gap-4">
        <div className="space-y-4">
          {SECTION_ORDER.map((section) => {
            const firstIndex = slides.findIndex((slide) => slide.section === section)
            if (firstIndex === -1) return null
            const active = slides[currentIndex]?.section === section
            return (
              <button
                key={section}
                type="button"
                onClick={() => onSelect(firstIndex)}
                title={section}
                className={cn(
                  'group flex w-14 flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-[10px] font-semibold uppercase tracking-wider transition',
                  active
                    ? 'border-primary/40 bg-primary/15 text-gold'
                    : 'border-white/10 bg-white/[0.025] text-stone-500 hover:bg-white/[0.06] hover:text-stone-200'
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span className="[writing-mode:vertical-rl]">{section}</span>
              </button>
            )
          })}
        </div>
        <div className="text-center text-xs text-stone-500">
          {currentIndex + 1}
          <span className="block text-stone-700">/</span>
          {slides.length}
        </div>
      </div>
    </aside>
  )
}
