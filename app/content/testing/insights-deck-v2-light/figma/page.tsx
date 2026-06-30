import { QaInsightsDeckFigmaExport } from '@/components/content/testing/qa-insights-deck'
import { QA_INSIGHTS_V2_LIGHT_SLIDES } from '@/lib/content-testing/qa-insights-deck-v2-light'

export default function QaInsightsDeckV2LightFigmaPage() {
  return <QaInsightsDeckFigmaExport slides={QA_INSIGHTS_V2_LIGHT_SLIDES} />
}
