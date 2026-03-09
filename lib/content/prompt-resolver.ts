import { prisma } from '@/lib/db'
import { PromptType } from '@/types/content'

interface PromptResolutionInput {
  promptType: PromptType
  promptId?: string
  guidelineId?: string
  projectId?: string
}

interface PromptResolutionResult {
  systemPrompt?: string
  guidelineText?: string
  promptId?: string
  guidelineId?: string
}

export async function resolvePromptAndGuideline({
  promptType,
  promptId,
  guidelineId,
  projectId,
}: PromptResolutionInput): Promise<PromptResolutionResult> {
  let resolvedPromptId = promptId
  let resolvedGuidelineId = guidelineId

  if (projectId) {
    const project = await prisma.qaProject.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      throw new Error('Project not found')
    }

    if (!resolvedPromptId) {
      resolvedPromptId =
        promptType === 'question_generator'
          ? project.questionPromptId || undefined
          : project.answerPromptId || undefined
    }

    if (!resolvedGuidelineId) {
      resolvedGuidelineId = project.guidelineId || undefined
    }
  }

  let systemPrompt: string | undefined
  if (resolvedPromptId) {
    const prompt = await prisma.contentPrompt.findUnique({
      where: { id: resolvedPromptId }
    })

    if (!prompt) {
      throw new Error('Prompt not found')
    }

    if (prompt.type !== promptType) {
      throw new Error('Prompt type mismatch')
    }

    systemPrompt = prompt.content
  }

  let guidelineText: string | undefined
  if (resolvedGuidelineId) {
    const guideline = await prisma.contentGuideline.findUnique({
      where: { id: resolvedGuidelineId }
    })

    if (!guideline) {
      throw new Error('Guideline not found')
    }

    guidelineText = guideline.content
  }

  return {
    systemPrompt,
    guidelineText,
    promptId: resolvedPromptId,
    guidelineId: resolvedGuidelineId,
  }
}
