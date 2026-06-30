import { RequireAuth } from '@/components/content/require-auth'
import { QaInsightsDeck } from '@/components/content/testing/qa-insights-deck'
import {
  QA_INSIGHTS_V2_LIGHT_SLIDES,
  QA_INSIGHTS_V2_LIGHT_SUMMARY,
} from '@/lib/content-testing/qa-insights-deck-v2-light'

export default function QaInsightsDeckV2LightPage() {
  return (
    <RequireAuth>
      <QaInsightsDeck
        slides={QA_INSIGHTS_V2_LIGHT_SLIDES}
        summary={QA_INSIGHTS_V2_LIGHT_SUMMARY}
        storageKey="qa-insights-deck-v2-light-index"
        deckLabel="QA Insights Deck V2 Light"
      />
    </RequireAuth>
  )
}
