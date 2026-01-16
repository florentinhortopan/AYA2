import { aiService } from '@/lib/ai'

interface PromptExecutionInput {
  systemPrompt: string
  userMessage: string
  guidelineText?: string
}

export async function runPrompt({ systemPrompt, userMessage, guidelineText }: PromptExecutionInput) {
  const combinedSystemPrompt = guidelineText
    ? `${systemPrompt}\n\nGuidelines:\n${guidelineText}`
    : systemPrompt

  return aiService.generateResponse(
    [{ role: 'user', content: userMessage }],
    { systemPrompt: combinedSystemPrompt }
  )
}
