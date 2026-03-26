'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { FieldStoryCardAsset } from '@/lib/campaigns/field-tested/types'

type StoryResponse = 'want_this' | 'need_details' | 'not_yet'

interface FieldStoryStackProps {
  cards: FieldStoryCardAsset[]
  disabled?: boolean
  onProgress?: (payload: { reviewedCount: number; responses: StoryResponse[] }) => void
}

export function FieldStoryStack({ cards, disabled, onProgress }: FieldStoryStackProps) {
  const [index, setIndex] = useState(0)
  const [responses, setResponses] = useState<StoryResponse[]>([])

  const safeCards = cards.length > 0 ? cards : []
  const current = safeCards[index]
  const reviewedCount = responses.length

  const canAdvance = useMemo(() => reviewedCount >= 3, [reviewedCount])

  const applyResponse = (response: StoryResponse) => {
    if (disabled || !current || safeCards.length === 0) return
    const nextResponses = [...responses, response]
    setResponses(nextResponses)
    const nextIndex = Math.min(index + 1, safeCards.length - 1)
    setIndex(nextIndex)
    onProgress?.({ reviewedCount: nextResponses.length, responses: nextResponses })
  }

  if (safeCards.length === 0) {
    return (
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">S4</p>
          <h2 className="text-2xl font-semibold">Field Stories Gallery</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Story assets are loading. If none are available, this section falls back to curated campaign placeholders.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">S4</p>
        <h2 className="text-2xl font-semibold">Field Stories Gallery</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          React to what you see so the journey can tune itself in real time.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Image src={current.imageUrl} alt={current.title} width={1200} height={500} className="h-64 w-full object-cover" />
        <div className="space-y-2 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{current.bucket}</p>
          <h3 className="text-lg font-semibold">{current.title}</h3>
          <p className="text-sm text-muted-foreground">{current.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => applyResponse('want_this')}
          className={cn(
            'rounded-md border px-3 py-1.5 text-sm font-medium',
            'border-border hover:border-primary/40 hover:text-primary'
          )}
        >
          I want this
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => applyResponse('need_details')}
          className={cn(
            'rounded-md border px-3 py-1.5 text-sm font-medium',
            'border-border hover:border-primary/40 hover:text-primary'
          )}
        >
          Need more detail
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => applyResponse('not_yet')}
          className={cn(
            'rounded-md border px-3 py-1.5 text-sm font-medium',
            'border-border hover:border-primary/40 hover:text-primary'
          )}
        >
          Not for me yet
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Reviewed: {reviewedCount} / 3 {canAdvance ? '- section ready' : '- keep exploring'}
      </p>
    </section>
  )
}
