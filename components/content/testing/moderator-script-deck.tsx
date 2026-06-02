'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  SCRIPT_SLIDES,
  SCRIPT_OVERVIEW,
  type ScriptSlide,
  type ScriptSection,
} from '@/lib/content-testing/moderator-script'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Minimize,
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  MessageSquareQuote,
  HelpCircle,
  AlertTriangle,
  Check,
} from 'lucide-react'

interface TimelineEntry {
  index: number
  id: string
  title: string
  atMs: number
  wall: string
}

const SECTION_STYLES: Record<ScriptSection, string> = {
  Intro: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  'Warm-up': 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  Core: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  Edge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Wrap-up': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
}

function fmt(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ModeratorScriptDeck({ sessionId }: { sessionId?: string }) {
  const slides = SCRIPT_SLIDES
  const total = slides.length
  const storageKey = `ct-script-${sessionId ?? 'blank'}`

  const [index, setIndex] = useState(0)
  const [showProbes, setShowProbes] = useState(true)
  const [showTimeline, setShowTimeline] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Timer: accumulated time plus the current run segment.
  const [running, setRunning] = useState(false)
  const [accumulatedMs, setAccumulatedMs] = useState(0)
  const [, setTick] = useState(0)
  const runStartRef = useRef<number | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const restoredRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const elapsedMs = accumulatedMs + (running && runStartRef.current ? Date.now() - runStartRef.current : 0)

  // Restore persisted state.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const data = JSON.parse(raw)
        if (typeof data.index === 'number') setIndex(Math.min(data.index, total - 1))
        if (typeof data.accumulatedMs === 'number') setAccumulatedMs(data.accumulatedMs)
        if (Array.isArray(data.timeline)) setTimeline(data.timeline)
        if (typeof data.showProbes === 'boolean') setShowProbes(data.showProbes)
      }
    } catch {
      /* ignore */
    }
    restoredRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  // Persist on change.
  useEffect(() => {
    if (!restoredRef.current) return
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ index, accumulatedMs: elapsedMs, timeline, showProbes })
      )
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, elapsedMs, timeline, showProbes, storageKey])

  // Re-render while running so the clock advances.
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setTick((n) => n + 1), 250)
    return () => clearInterval(t)
  }, [running])

  const startTimer = useCallback(() => {
    if (running) return
    runStartRef.current = Date.now()
    setRunning(true)
  }, [running])

  const pauseTimer = useCallback(() => {
    if (!running) return
    setAccumulatedMs((acc) => acc + (runStartRef.current ? Date.now() - runStartRef.current : 0))
    runStartRef.current = null
    setRunning(false)
  }, [running])

  const resetTimer = useCallback(() => {
    if (!confirm('Reset the timer and clear the recorded timeline for this session?')) return
    runStartRef.current = running ? Date.now() : null
    setAccumulatedMs(0)
    setTimeline([])
  }, [running])

  const logArrival = useCallback(
    (i: number, at: number) => {
      const slide = slides[i]
      setTimeline((prev) => {
        if (prev.some((e) => e.index === i)) return prev
        return [...prev, { index: i, id: slide.id, title: slide.title, atMs: at, wall: new Date().toISOString() }]
      })
    },
    [slides]
  )

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next))
      if (clamped === index) return
      // Auto-start the timer on the first forward move.
      let at = elapsedMs
      if (!running && clamped > index && accumulatedMs === 0 && timeline.length === 0) {
        runStartRef.current = Date.now()
        setRunning(true)
        at = 0
      }
      setIndex(clamped)
      logArrival(clamped, at)
    },
    [index, total, elapsedMs, running, accumulatedMs, timeline.length, logArrival]
  )

  const next = useCallback(() => go(index + 1), [go, index])
  const prev = useCallback(() => go(index - 1), [go, index])

  // Keyboard navigation.
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

  const timelineText = useMemo(() => {
    const header = `Content testing timeline${sessionId ? ` — session ${sessionId}` : ''}`
    const lines = timeline
      .slice()
      .sort((a, b) => a.atMs - b.atMs)
      .map((e) => `${fmt(e.atMs)}\t${e.title}\t${e.wall}`)
    return [header, 'elapsed\tstep\ttimestamp', ...lines].join('\n')
  }, [timeline, sessionId])

  const copyTimeline = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(timelineText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }, [timelineText])

  const downloadTimeline = useCallback(() => {
    const blob = new Blob([timelineText], { type: 'text/tab-separated-values;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `content-testing-timeline-${sessionId ?? 'session'}.tsv`
    a.click()
    URL.revokeObjectURL(url)
  }, [timelineText, sessionId])

  const slide = slides[index]
  const progressPct = ((index + 1) / total) * 100

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen flex-col bg-background text-foreground"
    >
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={sessionId ? `/content/testing/sessions/${sessionId}` : '/content/testing/sessions'}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Badge variant="outline" className={cn('shrink-0', SECTION_STYLES[slide.section])}>
            {slide.section}
          </Badge>
          <span className="truncate text-sm text-muted-foreground">
            Interviewer Script{sessionId ? ` · ${sessionId}` : ' · template'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Timer */}
          <div className="flex items-center gap-1 rounded-md border border-border/60 px-2 py-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="tabular-nums text-sm font-semibold">{fmt(elapsedMs)}</span>
            <button
              type="button"
              onClick={running ? pauseTimer : startTimer}
              className="ml-1 text-muted-foreground hover:text-foreground"
              aria-label={running ? 'Pause timer' : 'Start timer'}
            >
              {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={resetTimer}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Reset timer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProbes((v) => !v)}
            title={showProbes ? 'Hide moderator probes (tester-facing view)' : 'Show moderator probes'}
          >
            {showProbes ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="ml-1.5 hidden sm:inline">{showProbes ? 'Moderator' : 'Tester'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTimeline((v) => !v)}
            title="Show recorded timeline"
          >
            <Clock className="h-4 w-4" />
            <span className="ml-1.5 hidden sm:inline">Timeline</span>
            {timeline.length > 0 && (
              <span className="ml-1 rounded bg-primary/20 px-1 text-xs">{timeline.length}</span>
            )}
          </Button>

          <Button variant="outline" size="sm" onClick={toggleFullscreen} title="Toggle fullscreen (f)">
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Slide body */}
      <div className="relative flex flex-1 items-stretch overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-6 py-10 sm:px-10 sm:py-14">
            <SlideContent slide={slide} showProbes={showProbes} />
          </div>
        </div>

        {showTimeline && (
          <aside className="w-80 shrink-0 overflow-y-auto border-l border-border/50 bg-muted/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Recorded timeline</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={copyTimeline} title="Copy">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadTimeline} title="Download .tsv">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Timestamps are recorded automatically as you advance through the steps.
              </p>
            ) : (
              <ol className="space-y-1.5">
                {timeline
                  .slice()
                  .sort((a, b) => a.atMs - b.atMs)
                  .map((e) => (
                    <li
                      key={e.index}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded px-2 py-1 text-xs',
                        e.index === index ? 'bg-primary/15' : 'hover:bg-muted/50'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setIndex(e.index)}
                        className="truncate text-left hover:underline"
                      >
                        {e.title}
                      </button>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{fmt(e.atMs)}</span>
                    </li>
                  ))}
              </ol>
            )}
          </aside>
        )}
      </div>

      {/* Bottom controls */}
      <footer className="flex items-center justify-between gap-4 border-t border-border/50 px-4 py-3">
        <Button variant="outline" onClick={prev} disabled={index === 0} className="min-w-28">
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>

        <div className="flex flex-1 flex-col items-center gap-1">
          <span className="text-sm font-medium tabular-nums text-muted-foreground">
            {index + 1} / {total}
          </span>
          <div className="flex max-w-full flex-wrap items-center justify-center gap-1">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to ${s.title}`}
                title={s.title}
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  i === index
                    ? 'w-5 bg-primary'
                    : i < index
                      ? 'bg-primary/40 hover:bg-primary/60'
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
              />
            ))}
          </div>
        </div>

        <Button
          onClick={next}
          disabled={index === total - 1}
          className="min-w-28 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </footer>
    </div>
  )
}

function SlideContent({ slide, showProbes }: { slide: ScriptSlide; showProbes: boolean }) {
  const sayParagraphs = slide.say ? slide.say.split('\n\n') : []

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        {slide.eyebrow && (
          <p className="text-sm font-medium uppercase tracking-wider text-primary">{slide.eyebrow}</p>
        )}
        <h2 className="text-3xl font-bold leading-tight sm:text-4xl">{slide.title}</h2>
        {slide.estimate && (
          <p className="text-sm text-muted-foreground">Suggested time: {slide.estimate}</p>
        )}
      </div>

      {slide.kind === 'overview' && (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-left text-base sm:text-lg">
            <tbody>
              {SCRIPT_OVERVIEW.map((row) => (
                <tr key={row.section} className="border-b border-border/40 last:border-0">
                  <td className="w-12 px-4 py-3 font-semibold text-primary">{row.section}</td>
                  <td className="px-4 py-3">{row.activity}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-muted-foreground">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sayParagraphs.length > 0 && (
        <div className="space-y-4">
          {slide.kind !== 'closing' && (
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <MessageSquareQuote className="h-4 w-4" /> Moderator says
            </p>
          )}
          <div
            className={cn(
              'space-y-4 border-l-4 border-primary/60 pl-5',
              slide.kind === 'closing' && 'border-0 pl-0 text-center'
            )}
          >
            {sayParagraphs.map((p, i) => (
              <p
                key={i}
                className={cn(
                  'leading-relaxed text-foreground',
                  slide.kind === 'closing' ? 'text-2xl' : 'text-xl sm:text-2xl'
                )}
              >
                {p}
              </p>
            ))}
          </div>
        </div>
      )}

      {slide.note && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-lg border px-4 py-3 text-base',
            slide.tone === 'sensitive'
              ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
              : slide.tone === 'adversarial'
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                : 'border-primary/40 bg-primary/10 text-foreground'
          )}
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="font-medium">{slide.note}</p>
        </div>
      )}

      {slide.questions && slide.questions.length > 0 && (
        <ol className="space-y-3">
          {slide.questions.map((q, i) => (
            <li key={i} className="flex gap-3 text-xl leading-snug sm:text-2xl">
              <span className="shrink-0 font-bold text-primary">{i + 1}.</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      )}

      {slide.prompts && slide.prompts.length > 0 && (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <HelpCircle className="h-4 w-4" /> Ask — example prompts
          </p>
          <div className="flex flex-wrap gap-2.5">
            {slide.prompts.map((p, i) => (
              <span
                key={i}
                className="rounded-full border border-border/70 bg-muted/40 px-4 py-2 text-lg font-medium"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {showProbes && slide.probes && slide.probes.length > 0 && (
        <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Probe(s) — moderator follow-ups
          </p>
          <ul className="space-y-2.5">
            {slide.probes.map((p, i) => (
              <li key={i} className="flex gap-2.5 text-lg leading-snug">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
