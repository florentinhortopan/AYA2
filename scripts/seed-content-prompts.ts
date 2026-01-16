import { readFile } from 'fs/promises'
import { prisma } from '@/lib/db'

const promptFiles = {
  question: 'old-prompts/Question-Generator-Prompt.txt',
  answer: 'old-prompts/Answer-Generator-Prompt.txt',
  guideline: 'old-prompts/User-Guide-Instructions.txt'
}

async function ensurePrompt(name: string, type: 'question_generator' | 'answer_generator', version: string, content: string) {
  const existing = await prisma.contentPrompt.findFirst({
    where: { name, type, version }
  })

  if (existing) {
    return existing
  }

  return prisma.contentPrompt.create({
    data: {
      name,
      type,
      version,
      content,
      isActive: true
    }
  })
}

async function ensureGuideline(name: string, version: string, content: string) {
  const existing = await prisma.contentGuideline.findFirst({
    where: { name, version }
  })

  if (existing) {
    return existing
  }

  return prisma.contentGuideline.create({
    data: {
      name,
      version,
      content,
      isActive: true
    }
  })
}

async function main() {
  const questionPrompt = await readFile(promptFiles.question, 'utf8')
  const answerPrompt = await readFile(promptFiles.answer, 'utf8')
  const guidelineText = await readFile(promptFiles.guideline, 'utf8')

  const [question, answer, guideline] = await Promise.all([
    ensurePrompt('U.S. Army Question Generator', 'question_generator', '1.0', questionPrompt),
    ensurePrompt('U.S. Army Answer Generator', 'answer_generator', '1.0', answerPrompt),
    ensureGuideline('U.S. Army Q&A Workflow Guide', '1.0', guidelineText)
  ])

  console.log('Seeded prompt IDs:', { question: question.id, answer: answer.id, guideline: guideline.id })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
