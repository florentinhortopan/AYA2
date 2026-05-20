import { NextRequest, NextResponse } from 'next/server'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import {
  fetchRawPromptEvals,
  fetchBacklogIssues,
  rawCsvColumns,
  rawCsvRow,
  toCsv,
  backlogCsvColumns,
} from '@/lib/content-testing/exports'
import { buildAggregations } from '@/lib/content-testing/aggregations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    await requireAuthed()
    const url = new URL(req.url)
    const format = (url.searchParams.get('format') ?? 'csv').toLowerCase()
    const type = (url.searchParams.get('type') ?? 'raw').toLowerCase()
    const roundId = url.searchParams.get('roundId')
    const sessionId = url.searchParams.get('sessionId')

    if (type === 'raw') {
      const rows = await fetchRawPromptEvals({ roundId, sessionId })
      const mapped = rows.map(rawCsvRow)
      if (format === 'csv') {
        return new NextResponse(toCsv(mapped, rawCsvColumns()), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="content-testing-raw-${new Date().toISOString().slice(0, 10)}.csv"`,
          },
        })
      }
      if (format === 'json') {
        return NextResponse.json({ rows: mapped })
      }
      if (format === 'xlsx') {
        const { default: ExcelJS } = await import('exceljs')
        const workbook = new ExcelJS.Workbook()
        const sheet = workbook.addWorksheet('Raw Prompt Evaluations')
        const columns = rawCsvColumns()
        sheet.addRow(columns)
        mapped.forEach((r) => sheet.addRow(columns.map((c) => (r as Record<string, unknown>)[c])))
        sheet.columns.forEach((col) => {
          if (col) col.width = Math.min(40, Math.max(12, ((col.values?.length ?? 1) > 0 ? 20 : 12)))
        })
        const buf = await workbook.xlsx.writeBuffer()
        return new NextResponse(buf as unknown as BodyInit, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="content-testing-raw-${new Date().toISOString().slice(0, 10)}.xlsx"`,
          },
        })
      }
    }

    if (type === 'backlog') {
      const issues = await fetchBacklogIssues({
        severity: url.searchParams.get('severity'),
        status: url.searchParams.get('status'),
      })
      const mapped = issues.map((i) => ({
        backlogId: i.id,
        roundName: i.session?.round?.name ?? '',
        sessionId: i.sessionId,
        participantId: i.session?.participantId ?? '',
        participantType: i.session?.participantType ?? '',
        prompt: i.promptEval?.promptText ?? '',
        topic: i.promptEval?.topicArea ?? '',
        activity: i.promptEval?.activitySlug ?? '',
        issueType: i.issueType,
        severity: i.severity,
        description: i.description,
        evidenceResponse: i.evidenceResponse ?? '',
        evidenceParticipant: i.evidenceParticipant ?? '',
        recommendedAction: i.recommendedAction,
        suggestedRevision: i.suggestedRevision ?? '',
        owner: i.owner ?? '',
        priority: i.priority,
        status: i.status,
        requiresSme: i.requiresSme,
        requiresOfficialSource: i.requiresOfficialSource,
        requiresRecruiterReferral: i.requiresRecruiterReferral,
      }))
      if (format === 'csv' || format === 'xlsx') {
        if (format === 'csv') {
          return new NextResponse(toCsv(mapped, backlogCsvColumns()), {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="content-testing-backlog-${new Date().toISOString().slice(0, 10)}.csv"`,
            },
          })
        }
        const { default: ExcelJS } = await import('exceljs')
        const workbook = new ExcelJS.Workbook()
        const sheet = workbook.addWorksheet('Backlog')
        const columns = backlogCsvColumns()
        sheet.addRow(columns)
        mapped.forEach((r) => sheet.addRow(columns.map((c) => (r as Record<string, unknown>)[c])))
        const buf = await workbook.xlsx.writeBuffer()
        return new NextResponse(buf as unknown as BodyInit, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="content-testing-backlog-${new Date().toISOString().slice(0, 10)}.xlsx"`,
          },
        })
      }
      if (format === 'json') {
        return NextResponse.json({ rows: mapped })
      }
    }

    if (type === 'summary') {
      const aggregations = await buildAggregations({
        roundId,
        topicArea: url.searchParams.get('topicArea'),
        participantType: url.searchParams.get('participantType'),
      })
      if (format === 'json') {
        return NextResponse.json(aggregations)
      }
      if (format === 'pdf') {
        const { default: PDFDocument } = await import('pdfkit')
        const doc = new PDFDocument({ size: 'LETTER', margin: 54 })
        const chunks: Buffer[] = []
        doc.on('data', (c) => chunks.push(c as Buffer))
        const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

        doc.fontSize(20).text('Content Testing — Aggregated Findings', { align: 'left' })
        doc.moveDown(0.5)
        doc.fontSize(10).fillColor('gray').text(`Generated ${new Date().toLocaleString()}`)
        doc.moveDown()
        doc.fillColor('black')

        doc.fontSize(14).text('Executive Summary')
        doc.moveDown(0.25)
        doc.fontSize(11).text(`Prompts evaluated: ${aggregations.totals.promptEvals}`)
        doc.text(`Sessions: ${aggregations.totals.sessions}`)
        doc.text(`Critical issues: ${aggregations.totals.criticalIssues}`)
        doc.text(`High issues: ${aggregations.totals.highIssues}`)
        doc.text(`Readiness score: ${(aggregations.readiness.score * 100).toFixed(1)}%`)
        doc.moveDown()

        doc.fontSize(14).text('Average Scores by Criterion')
        doc.moveDown(0.25)
        doc.fontSize(11)
        aggregations.criterionAverages.forEach((c) => {
          doc.text(`${c.criterionKey}: ${c.average.toFixed(2)} (${c.count} scores)`)
        })
        doc.moveDown()

        doc.fontSize(14).text('Severity Distribution')
        doc.moveDown(0.25)
        doc.fontSize(11)
        Object.entries(aggregations.severityCounts).forEach(([k, v]) => {
          doc.text(`${k}: ${v}`)
        })
        doc.moveDown()

        doc.fontSize(14).text('Top Issue Types')
        doc.moveDown(0.25)
        doc.fontSize(11)
        aggregations.issueTypes
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
          .forEach((t) => doc.text(`${t.type}: ${t.count}`))
        doc.moveDown()

        doc.fontSize(14).text('Highest-Risk Topics')
        doc.moveDown(0.25)
        doc.fontSize(11)
        aggregations.topicRiskMatrix
          .sort((a, b) => b.averageSeverity * b.issueCount - a.averageSeverity * a.issueCount)
          .slice(0, 10)
          .forEach((t) =>
            doc.text(
              `${t.topic} — issues: ${t.issueCount}, avg severity weight: ${t.averageSeverity.toFixed(2)}`
            )
          )
        doc.moveDown()

        doc.fontSize(14).text('Lowest-Scoring Prompts')
        doc.moveDown(0.25)
        doc.fontSize(11)
        aggregations.lowestScoring.forEach((p) =>
          doc.text(`[${p.average.toFixed(2)}] ${p.activitySlug} — ${p.promptText}`, {
            width: 480,
          })
        )
        doc.moveDown()

        doc.fontSize(14).text('Critical & High Issues')
        doc.moveDown(0.25)
        doc.fontSize(10)
        aggregations.criticalHigh.forEach((i) => {
          doc.text(
            `[${i.severity}] ${i.issueType} — ${i.description} (Action: ${i.recommendedAction})`,
            { width: 480 }
          )
          doc.moveDown(0.2)
        })

        doc.end()
        const buf = await done
        return new NextResponse(buf as unknown as BodyInit, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="content-testing-summary-${new Date().toISOString().slice(0, 10)}.pdf"`,
          },
        })
      }
    }

    return NextResponse.json({ error: 'Unknown format/type' }, { status: 400 })
  } catch (err) {
    return handleApiError(err)
  }
}
