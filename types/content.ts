export type RatingValue = 1 | 2 | 3 | 4 | 5

export type ProjectStatus = 'draft' | 'in_progress' | 'review' | 'published' | 'archived'

// Unified content status - includes all statuses for both questions and answers
export type ContentStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'valid'
  | 'needs_review'
  | 'invalid'

// Question and Answer statuses now use the unified ContentStatus
export type QuestionStatus = ContentStatus
export type AnswerValidationStatus = ContentStatus

export type PromptType = 'question_generator' | 'answer_generator'

export interface ContentProject {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  targetQuestionCount: number
  questionCount: number
  answerCount: number
  promptIds: {
    questionPromptId?: string
    answerPromptId?: string
    guidelineId?: string
  }
}

export interface ContentQuestion {
  id: string
  topic: string
  persona?: string | null
  tone?: string | null
  questionText: string
  status: QuestionStatus
  sourceUrls: string[]
  ratingDefault?: RatingValue
  ratingValue?: RatingValue | null
}

export interface ContentAnswer {
  id: string
  questionId: string
  variantLevel: 'very_direct' | 'direct' | 'somewhat_direct' | 'indirect'
  answerText: string
  sourceLink?: string
  validationStatus: AnswerValidationStatus
  ratingDefault?: RatingValue
  ratingValue?: RatingValue | null
}

export interface ContentPrompt {
  id: string
  name: string
  type: PromptType
  version: string
  isActive: boolean
  content?: string
}

export interface ContentGuideline {
  id: string
  name: string
  version: string
  isActive: boolean
  content?: string
}
