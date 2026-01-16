import { extractMarkdownTables, getColumnIndex } from '@/lib/content/markdown-table'

export interface ParsedQuestionRow {
  topic: string
  persona?: string
  tone?: string
  questionText: string
  sourceUrl?: string
}

export interface ParsedAnswerRow {
  questionText?: string
  variantLevel: string
  answerText: string
  sourceLink?: string
}

export function parseQuestionsFromMarkdown(text: string): ParsedQuestionRow[] {
  const tables = extractMarkdownTables(text)
  const rows: ParsedQuestionRow[] = []

  for (const table of tables) {
    const topicIdx = getColumnIndex(table.headers, ['topic'])
    const personaIdx = getColumnIndex(table.headers, ['persona'])
    const toneIdx = getColumnIndex(table.headers, ['tone'])
    const questionIdx = getColumnIndex(table.headers, ['question'])
    const sourceIdx = getColumnIndex(table.headers, ['source', 'url', 'link'])

    if (questionIdx === -1 || topicIdx === -1) {
      continue
    }

    for (const row of table.rows) {
      const questionText = row[questionIdx]?.trim()
      const topic = row[topicIdx]?.trim()

      if (!questionText || !topic) {
        continue
      }

      rows.push({
        topic,
        persona: personaIdx !== -1 ? row[personaIdx]?.trim() || undefined : undefined,
        tone: toneIdx !== -1 ? row[toneIdx]?.trim() || undefined : undefined,
        questionText,
        sourceUrl: sourceIdx !== -1 ? row[sourceIdx]?.trim() || undefined : undefined,
      })
    }
  }

  return rows
}

export function parseAnswersFromMarkdown(text: string): ParsedAnswerRow[] {
  const tables = extractMarkdownTables(text)
  const rows: ParsedAnswerRow[] = []

  for (const table of tables) {
    const questionIdx = getColumnIndex(table.headers, ['question'])
    const variantIdx = getColumnIndex(table.headers, ['variant', 'level'])
    const answerIdx = getColumnIndex(table.headers, ['answer'])
    const sourceIdx = getColumnIndex(table.headers, ['source', 'url', 'link'])

    if (answerIdx === -1 || variantIdx === -1) {
      continue
    }

    for (const row of table.rows) {
      const answerText = row[answerIdx]?.trim()
      const variantLevel = row[variantIdx]?.trim()

      if (!answerText || !variantLevel) {
        continue
      }

      rows.push({
        questionText: questionIdx !== -1 ? row[questionIdx]?.trim() || undefined : undefined,
        variantLevel,
        answerText,
        sourceLink: sourceIdx !== -1 ? row[sourceIdx]?.trim() || undefined : undefined,
      })
    }
  }

  return rows
}

export function normalizeVariantLevel(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .trim()

  if (['very_direct', 'direct', 'somewhat_direct', 'indirect'].includes(normalized)) {
    return normalized
  }

  if (normalized.includes('very') && normalized.includes('direct')) {
    return 'very_direct'
  }
  if (normalized.includes('somewhat') && normalized.includes('direct')) {
    return 'somewhat_direct'
  }
  if (normalized.includes('direct')) {
    return 'direct'
  }

  return 'indirect'
}
