interface MarkdownTable {
  headers: string[]
  rows: string[][]
}

const normalizeCell = (value: string) => value.trim().replace(/\s+/g, ' ')

const splitRow = (line: string) => {
  const trimmed = line.trim()
  const withoutOuterPipes = trimmed.startsWith('|') && trimmed.endsWith('|')
    ? trimmed.slice(1, -1)
    : trimmed
  return withoutOuterPipes
    .split('|')
    .map((cell) => normalizeCell(cell))
}

const isSeparatorRow = (cells: string[]) =>
  cells.every((cell) => cell.replace(/:/g, '').match(/^-+$/))

export function extractMarkdownTables(text: string): MarkdownTable[] {
  const lines = text.split('\n')
  const tables: MarkdownTable[] = []
  let currentHeaders: string[] | null = null
  let currentRows: string[][] = []

  const flush = () => {
    if (currentHeaders && currentRows.length > 0) {
      tables.push({ headers: currentHeaders, rows: currentRows })
    }
    currentHeaders = null
    currentRows = []
  }

  for (const line of lines) {
    if (!line.includes('|')) {
      flush()
      continue
    }

    const cells = splitRow(line)
    if (cells.length < 2) {
      flush()
      continue
    }

    if (!currentHeaders) {
      currentHeaders = cells
      continue
    }

    if (isSeparatorRow(cells)) {
      continue
    }

    if (cells.length !== currentHeaders.length) {
      // Try to normalize by padding or trimming
      const normalized = [...cells]
      while (normalized.length < currentHeaders.length) {
        normalized.push('')
      }
      currentRows.push(normalized.slice(0, currentHeaders.length))
      continue
    }

    currentRows.push(cells)
  }

  flush()
  return tables
}

export function getColumnIndex(headers: string[], candidates: string[]) {
  const normalized = headers.map((header) => header.toLowerCase())
  return candidates.reduce((found, candidate) => {
    if (found !== -1) {
      return found
    }
    return normalized.findIndex((header) => header.includes(candidate))
  }, -1)
}
