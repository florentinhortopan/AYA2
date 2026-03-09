import { ContentAnswer, ContentGuideline, ContentProject, ContentPrompt, ContentQuestion } from '@/types/content'

export const sampleProjects: ContentProject[] = [
  {
    id: 'project-1',
    name: 'Army 2026 Q1',
    description: 'Recruitment Q&A for spring',
    status: 'in_progress',
    targetQuestionCount: 250,
    questionCount: 250,
    answerCount: 750,
    promptIds: {
      questionPromptId: 'prompt-q-1',
      answerPromptId: 'prompt-a-1',
      guidelineId: 'guideline-1'
    }
  },
  {
    id: 'project-2',
    name: 'Benefits 2026',
    description: 'Benefits coverage refresh',
    status: 'draft',
    targetQuestionCount: 200,
    questionCount: 0,
    answerCount: 0,
    promptIds: {}
  }
]

export const sampleQuestions: ContentQuestion[] = [
  {
    id: 'question-1',
    topic: 'Enlistment Process',
    persona: 'Prospect',
    tone: 'Neutral',
    questionText: 'What are the steps to enlist in the Army?',
    status: 'draft',
    sourceUrls: ['https://www.goarmy.com/how-to-join/steps-to-enlist.html'],
    ratingDefault: 4,
    ratingValue: 4
  },
  {
    id: 'question-2',
    topic: 'Benefits',
    persona: 'Family Member',
    tone: 'Skeptical',
    questionText: 'How does housing allowance work for families?',
    status: 'approved',
    sourceUrls: ['https://www.goarmy.com/benefits/military-pay-allowances.html'],
    ratingDefault: 3,
    ratingValue: 3
  }
]

export const sampleAnswers: ContentAnswer[] = [
  {
    id: 'answer-1',
    questionId: 'question-1',
    variantLevel: 'very_direct',
    answerText: 'Start by verifying eligibility, meet a recruiter, take the ASVAB, complete MEPS, and finish final processing before swearing in.',
    sourceLink: 'https://www.goarmy.com/how-to-join/steps-to-enlist.html',
    validationStatus: 'needs_review',
    ratingDefault: 4,
    ratingValue: 4
  },
  {
    id: 'answer-2',
    questionId: 'question-1',
    variantLevel: 'indirect',
    answerText: 'A recruiter can walk you through eligibility, testing, and medical steps. It helps to prepare documents early and confirm timelines with your local office.',
    sourceLink: 'https://www.goarmy.com/how-to-join/steps-to-enlist.html',
    validationStatus: 'pending',
    ratingDefault: 3,
    ratingValue: 3
  }
]

export const samplePrompts: ContentPrompt[] = [
  {
    id: 'prompt-q-1',
    name: 'Question Generator v1',
    type: 'question_generator',
    version: '1.0',
    isActive: true
  },
  {
    id: 'prompt-a-1',
    name: 'Answer Generator v1',
    type: 'answer_generator',
    version: '1.0',
    isActive: true
  }
]

export const sampleGuidelines: ContentGuideline[] = [
  {
    id: 'guideline-1',
    name: 'Default Guidelines',
    version: '1.0',
    isActive: true
  }
]
