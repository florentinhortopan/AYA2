import { prisma } from '@/lib/db'
import type { IntentCluster } from './intent-clusterer'

/**
 * Q&A data from the linked project for validation
 */
export interface QaProjectData {
  projectId: string
  questions: Array<{
    id: string
    questionText: string
    status: string
    topic?: string | null
    answers: Array<{
      id: string
      answerText: string
      validationStatus: string
      variantLevel?: string | null
    }>
  }>
}

/**
 * Validates intent clusters against available Q&A data.
 * Only returns intents that have both questions AND answers available.
 */
export async function validateIntentsAgainstAnswers(
  intentClusters: IntentCluster[],
  qaProjectId: string | null | undefined,
  questionStatuses: string[] = ['approved', 'published', 'valid'],
  answerStatuses: string[] = ['approved', 'published', 'valid']
): Promise<{
  validClusters: IntentCluster[]
  invalidClusters: IntentCluster[]
  qaData?: QaProjectData
}> {
  // If no Q&A project linked, return all clusters as valid (no validation possible)
  if (!qaProjectId) {
    console.warn('[Answer Validator] No Q&A project linked, skipping answer validation')
    return {
      validClusters: intentClusters,
      invalidClusters: []
    }
  }

  try {
    // Fetch Q&A data from the linked project
    const questions = await prisma.qaQuestion.findMany({
      where: {
        projectId: qaProjectId,
        status: { in: questionStatuses }
      },
      include: {
        answers: {
          where: {
            validationStatus: { in: answerStatuses }
          },
          orderBy: { updatedAt: 'desc' }
        }
      }
    })

    const qaData: QaProjectData = {
      projectId: qaProjectId,
      questions: questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        status: q.status,
        topic: q.topic,
        answers: q.answers.map(a => ({
          id: a.id,
          answerText: a.answerText,
          validationStatus: a.validationStatus,
          variantLevel: a.variantLevel
        }))
      }))
    }

    // Validate each intent cluster
    const validClusters: IntentCluster[] = []
    const invalidClusters: IntentCluster[] = []

    for (const cluster of intentClusters) {
      // Check if this intent has matching questions with answers
      const matchingQuestions = qaData.questions.filter(q => {
        const questionText = q.questionText.toLowerCase()
        const intent = cluster.intent.toLowerCase()
        const description = cluster.description.toLowerCase()
        
        // Check if question text or topic matches intent
        return questionText.includes(intent) ||
               questionText.includes(description) ||
               (q.topic && q.topic.toLowerCase().includes(intent)) ||
               cluster.questions.some(cq => 
                 questionText.includes(cq.toLowerCase()) ||
                 cq.toLowerCase().includes(questionText)
               )
      })

      // An intent is valid if it has at least one matching question with at least one answer
      const hasValidAnswers = matchingQuestions.some(q => q.answers.length > 0)

      if (hasValidAnswers) {
        // Filter pill candidates to only those that match questions with answers
        const validatedPillCandidates = cluster.pillCandidates.filter(pillLabel => {
          // Check if this pill label would match any question with answers
          const pillLower = pillLabel.toLowerCase()
          return matchingQuestions.some(q => {
            if (q.answers.length === 0) return false
            
            // Check if pill label matches question text or topic
            const questionLower = q.questionText.toLowerCase()
            const topicLower = q.topic?.toLowerCase() || ''
            
            return questionLower.includes(pillLower) ||
                   pillLower.includes(questionLower) ||
                   topicLower.includes(pillLower) ||
                   pillLower.includes(topicLower) ||
                   // Check if pill is a natural variation of the question
                   areSemanticallySimilar(pillLower, questionLower)
          })
        })

        if (validatedPillCandidates.length > 0) {
          validClusters.push({
            ...cluster,
            pillCandidates: validatedPillCandidates
          })
        } else {
          console.warn(`[Answer Validator] Intent "${cluster.intent}" has no valid pill candidates after answer validation`)
          invalidClusters.push(cluster)
        }
      } else {
        console.warn(`[Answer Validator] Intent "${cluster.intent}" has no matching questions with answers`)
        invalidClusters.push(cluster)
      }
    }

    console.log(`[Answer Validator] Validated ${intentClusters.length} intents: ${validClusters.length} valid, ${invalidClusters.length} invalid`)

    return {
      validClusters,
      invalidClusters,
      qaData
    }
  } catch (error) {
    console.error('[Answer Validator] Error validating intents against answers:', error)
    // On error, return all clusters as valid (fail open)
    return {
      validClusters: intentClusters,
      invalidClusters: [],
      qaData: undefined
    }
  }
}

/**
 * Simple semantic similarity check (can be enhanced with embeddings later)
 */
function areSemanticallySimilar(text1: string, text2: string): boolean {
  // Extract key words (remove stop words)
  const words1 = text1.split(/\s+/).filter(w => w.length > 3)
  const words2 = text2.split(/\s+/).filter(w => w.length > 3)
  
  // Check if they share significant words
  const commonWords = words1.filter(w => words2.includes(w))
  return commonWords.length >= Math.min(2, Math.min(words1.length, words2.length) / 2)
}

/**
 * Normalize text for matching (same as chat endpoint)
 */
const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Tokenize text (same as chat endpoint)
 */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'than', 'to', 'of', 'for', 'on', 'in', 'at', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'with', 'from', 'as', 'it', 'this', 'that', 'these',
  'those', 'i', 'you', 'we', 'they', 'he', 'she', 'my', 'your', 'our', 'their', 'me', 'us', 'them', 'do',
  'does', 'did', 'can', 'could', 'should', 'would', 'will', 'may', 'might', 'about', 'into', 'what', 'how',
  'why', 'when', 'where', 'which', 'who'
])

const tokenize = (value: string) =>
  normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))

/**
 * Score match between query tokens and text (same as chat endpoint)
 */
const scoreMatch = (queryTokens: string[], text: string) => {
  const textTokens = new Set(tokenize(text))
  let score = 0
  for (const token of queryTokens) {
    if (textTokens.has(token)) {
      score += 1
    }
  }
  return score
}

/**
 * Validates a single pill label against available answers.
 * Uses the same matching logic as the chat endpoint for consistency.
 * Returns true if the pill would likely lead to a question with answers.
 */
export async function validatePillLabel(
  pillLabel: string,
  qaProjectId: string | null | undefined,
  questionStatuses: string[] = ['approved', 'published', 'valid'],
  answerStatuses: string[] = ['approved', 'published', 'valid']
): Promise<boolean> {
  if (!qaProjectId) {
    return true // No validation possible
  }

  try {
    const questions = await prisma.qaQuestion.findMany({
      where: {
        projectId: qaProjectId,
        status: { in: questionStatuses }
      },
      include: {
        answers: {
          where: {
            validationStatus: { in: answerStatuses }
          }
        }
      }
    })

    if (questions.length === 0) {
      // No questions available, fail open (don't block pills)
      return true
    }

    const pillTokens = tokenize(pillLabel)
    if (pillTokens.length === 0) {
      // Pill label has no meaningful tokens, fail open
      return true
    }
    
    // Use the same scoring logic as the chat endpoint
    // A pill is valid if it would match at least one question with answers
    return questions.some(q => {
      if (q.answers.length === 0) return false
      
      // Build searchable text (same as chat endpoint)
      const answerText = q.answers.map(a => a.answerText).join(' ') || ''
      const searchableText = [
        q.questionText,
        q.topic,
        answerText
      ].filter(Boolean).join(' ')
      
      // Score the match (same as chat endpoint)
      const score = scoreMatch(pillTokens, searchableText)
      
      // Pill is valid if it has at least 1 matching token (lenient threshold)
      // This matches the chat endpoint's behavior where any token match can work
      return score > 0
    })
  } catch (error) {
    console.error('[Answer Validator] Error validating pill label:', error)
    return true // Fail open - don't block pills on validation errors
  }
}
