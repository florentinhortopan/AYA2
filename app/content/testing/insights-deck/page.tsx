import { RequireAuth } from '@/components/content/require-auth'
import { QaInsightsDeck } from '@/components/content/testing/qa-insights-deck'

export default function QaInsightsDeckPage() {
  return (
    <RequireAuth>
      <QaInsightsDeck />
    </RequireAuth>
  )
}
