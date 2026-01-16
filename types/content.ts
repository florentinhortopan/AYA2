export type RatingValue = 1 | 2 | 3 | 4 | 5

export type ProjectStatus = 'draft' | 'in_progress' | 'review' | 'published' | 'archived'
export type QuestionStatus = 'draft' | 'approved' | 'rejected' | 'published'
export type AnswerValidationStatus = 'pending' | 'valid' | 'needs_review' | 'invalid'
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
}

export interface ContentGuideline {
  id: string
  name: string
  version: string
  isActive: boolean
}
