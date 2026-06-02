import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthed, handleApiError } from '@/lib/content-testing/authz'
import {
  fetchRawPromptEvals,
  fetchBacklogIssues,
  rawCsvColumns,
  rawCsvRow,
  toCsv,
  backlogCsvColumns,
} from '@/lib/content-testing/exports'
import {
  buildIntakeMaskMarkdown,
  buildIntakeMaskCsv,
  buildIntakeMaskRows,
  intakeMaskColumns,
  intakeColumnLabels,
  intakeMaskMetaPairs,
  intakeValidation,
  type IntakeMaskSession,
  type IntakeCatalog,
} from '@/lib/content-testing/intake-mask'
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

    if (type === 'intake') {
      let session: IntakeMaskSession | null = null
      if (sessionId) {
        session = (await prisma.contentTestSession.findUnique({
          where: { id: sessionId },
          select: {
            id: true,
            participantId: true,
            participantType: true,
            environment: true,
            recordingPermission: true,
            sessionObjective: true,
            startedAt: true,
            createdAt: true,
            round: { select: { name: true } },
            moderator: { select: { name: true, email: true } },
          },
        })) as unknown as IntakeMaskSession | null
      }
      const catalog = await fetchIntakeCatalog()
      const stamp = new Date().toISOString().slice(0, 10)
      const slug = session ? `${session.participantId}-${stamp}` : `blank-${stamp}`
      if (format === 'csv') {
        return new NextResponse(buildIntakeMaskCsv(session, catalog), {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="intake-mask-${slug}.csv"`,
          },
        })
      }
      if (format === 'xlsx') {
        const buf = await buildIntakeMaskXlsx(session, catalog)
        return new NextResponse(buf as unknown as BodyInit, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="intake-mask-${slug}.xlsx"`,
          },
        })
      }
      // default: markdown
      return new NextResponse(buildIntakeMaskMarkdown(session, catalog), {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="intake-mask-${slug}.md"`,
        },
      })
    }

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

/**
 * Build the intake-mask catalog from the LIVE database so the generated files
 * always reflect the activities currently configured for sessions. Only active
 * activities and non-archived prompts are included, matching the moderator UI.
 */
async function fetchIntakeCatalog(): Promise<IntakeCatalog> {
  const [activities, criteria] = await Promise.all([
    prisma.contentTestActivity.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        promptBank: {
          where: { isArchived: false },
          orderBy: { createdAt: 'asc' },
          select: { promptText: true, topicArea: true },
        },
      },
    }),
    prisma.contentTestCriterion.findMany({
      orderBy: { order: 'asc' },
      select: { key: true, label: true },
    }),
  ])

  return {
    activities: activities.map((a) => ({
      slug: a.slug,
      order: a.order,
      title: a.title,
      objective: a.objective,
      useCaseCategory: a.useCaseCategory as string,
      capturesPrompts: a.capturesPrompts,
      isSensitive: a.isSensitive,
      isAdversarial: a.isAdversarial,
      followUpQuestions: (a.followUpQuestions as string[] | null) ?? null,
      warmupQuestions:
        (a.warmupQuestions as Array<{ key: string; question: string }> | null) ?? null,
      wrapUpQuestions:
        (a.wrapUpQuestions as Array<{ key: string; question: string }> | null) ?? null,
      promptBank: a.promptBank.map((p) => ({
        promptText: p.promptText,
        topicArea: (p.topicArea as string | null) ?? null,
      })),
    })),
    criteria: criteria.map((c) => ({ key: c.key, label: c.label })),
  }
}

async function buildIntakeMaskXlsx(session: IntakeMaskSession | null, catalog: IntakeCatalog) {
  const { default: ExcelJS } = await import('exceljs')
  const validation = intakeValidation(catalog)
  const labels = intakeColumnLabels(catalog)
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Army Answers Content Testing'
  wb.created = new Date()

  // Session Info sheet — metadata, scoring scale, and enum reference.
  const info = wb.addWorksheet('Session Info')
  info.columns = [{ width: 26 }, { width: 70 }]
  info.addRow(['Field', 'Value']).font = { bold: true }
  for (const [label, value] of intakeMaskMetaPairs(session)) info.addRow([label, value])
  info.addRow([])
  info.addRow(['Scoring scale', validation.scoringScale]).getCell(1).font = { bold: true }
  info.addRow([])
  info.addRow(['Reference', '']).getCell(1).font = { bold: true }
  info.addRow(['Criteria', validation.criteriaKeys.join(', ')])
  info.addRow(['Severities', validation.severities.join(', ')])
  info.addRow(['Issue types', validation.issueTypes.join(', ')])
  info.addRow(['Topic areas', validation.topicAreas.join(', ')])
  info.addRow(['Next step types', validation.nextStepTypes.join(', ')])
  info.getColumn(2).alignment = { wrapText: true, vertical: 'top' }

  // Prompts scaffold sheet — one row per prompt for every activity, ready to fill.
  const columns = intakeMaskColumns(catalog)
  const rows = buildIntakeMaskRows(session, catalog)
  const sheet = wb.addWorksheet('Prompts')
  const headerRow = sheet.addRow(columns.map((c) => labels[c] ?? c))
  headerRow.font = { bold: true }
  for (const r of rows) sheet.addRow(columns.map((c) => (r as Record<string, unknown>)[c] ?? ''))
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }

  const wide = new Set([
    'prompt_text',
    'response_summary',
    'participant_reaction',
    'key_quote',
    'notes',
    'issue_note',
  ])
  columns.forEach((c, i) => {
    const col = sheet.getColumn(i + 1)
    col.width = wide.has(c) ? 32 : Math.max(10, Math.min(24, (labels[c] ?? c).length + 4))
    if (wide.has(c)) col.alignment = { wrapText: true, vertical: 'top' }
  })

  // Dropdown validation on each fillable cell so note-takers fill consistently.
  const lastRow = rows.length + 1
  const applyList = (colKey: string, list: string[]) => {
    const idx = columns.indexOf(colKey)
    if (idx < 0) return
    const joined = list.join(',')
    if (joined.length > 250) return
    const letter = sheet.getColumn(idx + 1).letter
    for (let r = 2; r <= lastRow; r++) {
      sheet.getCell(`${letter}${r}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${joined}"`],
      }
    }
  }
  for (const key of validation.criteriaKeys) applyList(key, validation.scoreValues)
  applyList('prompt_source', validation.promptSources)
  applyList('topic_area', validation.topicAreas)
  applyList('issue_type', validation.issueTypes)
  applyList('issue_severity', validation.severities)
  applyList('next_step_type', validation.nextStepTypes)
  applyList('quote_included', validation.yesNo)
  applyList('next_step_included', validation.yesNo)

  return wb.xlsx.writeBuffer()
}
