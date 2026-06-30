import { RequireAuth } from '@/components/content/require-auth'
import { QaInsightsDeckPrint } from '@/components/content/testing/qa-insights-deck'
import { QA_INSIGHTS_V2_LIGHT_SLIDES } from '@/lib/content-testing/qa-insights-deck-v2-light'

export default function QaInsightsDeckV2LightPrintPage() {
  return (
    <RequireAuth>
      <QaInsightsDeckPrint
        slides={QA_INSIGHTS_V2_LIGHT_SLIDES}
        deckLabel="QA Insights Deck V2 Light"
      />
    </RequireAuth>
  )
}
