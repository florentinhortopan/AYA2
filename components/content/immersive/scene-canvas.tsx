'use client'

import { ImmersiveCard, SceneDirective } from '@/lib/content/immersive/scene-orchestrator'
import { Button } from '@/components/ui/button'

interface SceneCanvasProps {
  cards: ImmersiveCard[]
  directives: SceneDirective[]
  onCardClick: (card: ImmersiveCard) => void
}

const transitionClass = (directive?: SceneDirective): string => {
  if (!directive) return 'transition-opacity duration-300 ease-out opacity-100'
  if (directive.transition === 'slide') return 'transition-all duration-500 ease-out translate-y-0 opacity-100'
  if (directive.transition === 'parallax') return 'transition-all duration-500 ease-out scale-[1.01] opacity-100'
  if (directive.transition === 'none') return ''
  return 'transition-opacity duration-500 ease-out opacity-100'
}

export function SceneCanvas({ cards, directives, onCardClick }: SceneCanvasProps) {
  const mainDirective = directives[0]
  const panelDirective = directives.find((item) => item.action === 'panel_add')
  const ctaDirective = directives.find((item) => item.action === 'cta_state')
  const sortedCards = [...cards].sort((a, b) => {
    const typeOrder: Record<string, number> = { insight: 0, rag: 1, image: 2, table: 3, video: 4, job: 5, cta: 6 }
    return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99)
  })

  return (
    <section className={`h-full overflow-y-auto px-6 py-8 ${transitionClass(mainDirective)}`}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 pb-28 md:grid-cols-2">
        {sortedCards.map((card) => (
          <article
            key={card.id}
            className="rounded-2xl border border-white/25 bg-black/35 p-4 text-white backdrop-blur-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-white/70">{card.type}</p>
              {card.sourceUrl ? (
                <a
                  href={card.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-200 hover:text-cyan-100"
                >
                  Source
                </a>
              ) : null}
            </div>
            <h3 className="text-lg font-semibold">{card.title}</h3>
            <p className="mt-2 text-sm text-white/85">{card.body}</p>

            {card.type === 'video' && card.sourceUrl?.includes('/embed/') ? (
              <iframe
                className="mt-3 h-52 w-full rounded-xl border border-white/20"
                src={card.sourceUrl}
                title={card.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : null}

            {card.type === 'image' && card.sourceUrl ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-white/20 bg-black/20">
                <img
                  src={card.sourceUrl}
                  alt={card.title}
                  loading="lazy"
                  className="h-52 w-full object-cover"
                />
                {card.body ? <p className="px-3 py-2 text-xs text-white/80">{card.body}</p> : null}
              </div>
            ) : null}

            {card.type === 'table' && card.table ? (
              <div className="mt-3 overflow-x-auto rounded-xl border border-white/20">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/10">
                    <tr>
                      {card.table.headers.map((header) => (
                        <th key={header} className="px-3 py-2 font-semibold text-white/90">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {card.table.rows.map((row, rowIndex) => (
                      <tr key={`${card.id}-row-${rowIndex}`} className="border-t border-white/10">
                        {row.map((cell, cellIndex) => (
                          <td key={`${card.id}-cell-${rowIndex}-${cellIndex}`} className="px-3 py-2 text-white/85">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => onCardClick(card)}>
                Focus This
              </Button>
            </div>
          </article>
        ))}
      </div>

      {panelDirective ? (
        <div className="pointer-events-none fixed right-6 top-20 rounded-xl border border-cyan-300/45 bg-cyan-950/35 px-3 py-2 text-xs text-cyan-100 backdrop-blur">
          Scene: {panelDirective.target.replace(/_/g, ' ')}
        </div>
      ) : null}

      {ctaDirective ? (
        <div className="fixed bottom-24 right-6 rounded-xl border border-emerald-300/50 bg-emerald-900/35 px-4 py-3 text-sm text-emerald-100 backdrop-blur">
          Conversion-ready state detected
        </div>
      ) : null}
    </section>
  )
}
