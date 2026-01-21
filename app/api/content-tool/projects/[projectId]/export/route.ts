import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const DEFAULT_QUESTION_STATUSES = ['approved']
const DEFAULT_ANSWER_STATUSES = ['approved']

const parseListParam = (value: string | null, fallback: string[]) => {
  if (!value) {
    return fallback
  }
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return items.length > 0 ? items : fallback
}

const escapeCsvCell = (value: string) => {
  const needsQuotes = /[",\n]/.test(value)
  const escaped = value.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

const toCsv = (rows: string[][]) =>
  rows
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
    .join('\n')

const toFileSlug = (value: string) => {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
  return slug || 'project'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { searchParams } = new URL(request.url)
  const format = (searchParams.get('format') || 'json').toLowerCase()
  const questionStatuses = parseListParam(
    searchParams.get('questionStatus'),
    DEFAULT_QUESTION_STATUSES
  )
  const answerStatuses = parseListParam(
    searchParams.get('answerStatus'),
    DEFAULT_ANSWER_STATUSES
  )

  const project = await prisma.qaProject.findUnique({
    where: { id: params.projectId }
  })

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const dateStamp = new Date().toISOString().slice(0, 10)
  const nameSlug = toFileSlug(project.name || '')
  const buildFilename = (extension: string) => `${nameSlug}-${dateStamp}.${extension}`

  const questions = await prisma.qaQuestion.findMany({
    where: {
      projectId: params.projectId,
      status: { in: questionStatuses }
    },
    include: {
      answers: {
        where: {
          validationStatus: { in: answerStatuses }
        },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'asc' }
  })

  if (format === 'json') {
    const payload = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status
      },
      filters: {
        questionStatus: questionStatuses,
        answerStatus: answerStatuses
      },
      questions
    }
    const json = JSON.stringify(payload, null, 2)
    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${buildFilename('json')}"`
      }
    })
  }

  const rows: string[][] = [
    [
      'question_id',
      'question_status',
      'topic',
      'persona',
      'tone',
      'question',
      'answer_id',
      'answer_status',
      'variant_level',
      'answer',
      'source_link',
      'keywords'
    ]
  ]

  for (const question of questions) {
    for (const answer of question.answers) {
      rows.push([
        question.id,
        question.status,
        question.topic,
        question.persona || '',
        question.tone || '',
        question.questionText,
        answer.id,
        answer.validationStatus,
        answer.variantLevel,
        answer.answerText,
        answer.sourceLink || '',
        answer.keywords.join(', ')
      ])
    }
  }

  if (format === 'csv') {
    const csv = toCsv(rows)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${buildFilename('csv')}"`
      }
    })
  }

  if (format === 'markdown' || format === 'md') {
    const markdownRows = rows.map((row) => `| ${row.join(' | ')} |`)
    const headerSeparator = `| ${rows[0].map(() => '---').join(' | ')} |`
    const markdown = [markdownRows[0], headerSeparator, ...markdownRows.slice(1)].join('\n')
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${buildFilename('md')}"`
      }
    })
  }

  return NextResponse.json(
    { error: 'Unsupported format. Use json, csv, or markdown.' },
    { status: 400 }
  )
}
