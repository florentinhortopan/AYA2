export const CRITERION_LABELS: Record<string, string> = {
  relevance: 'Relevance',
  completeness: 'Completeness',
  accuracy: 'Accuracy',
  clarity: 'Clarity',
  readability: 'Readability',
  authenticity: 'Authenticity',
  trustworthiness: 'Trustworthiness',
  brand_voice: 'Brand Voice',
  brand_safety: 'Brand Safety',
  quote_usefulness: 'Quote Usefulness',
  next_best_action: 'Next Best Action',
  sensitivity_handling: 'Sensitivity Handling',
  overall_readiness: 'Overall Readiness',
}

export const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/30',
  HIGH: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  MEDIUM: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  LOW: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
}

export const READINESS_STYLES: Record<string, string> = {
  READY: 'bg-green-500/10 text-green-500 border-green-500/30',
  MOSTLY_READY: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  NEEDS_ITERATION: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
  NOT_READY: 'bg-red-500/10 text-red-500 border-red-500/30',
}

export const READINESS_LABELS: Record<string, string> = {
  READY: 'Ready',
  MOSTLY_READY: 'Mostly Ready',
  NEEDS_ITERATION: 'Needs Iteration',
  NOT_READY: 'Not Ready',
}

export const PARTICIPANT_TYPE_LABELS: Record<string, string> = {
  INTERNAL_TESTER: 'Internal Tester',
  PROSPECT_LIKE: 'Prospect-like',
  PARENT_GUARDIAN: 'Parent / Guardian',
  EDUCATOR: 'Educator',
  INFLUENCER: 'Influencer',
  RECRUITER: 'Recruiter',
  CONTENT_REVIEWER: 'Content Reviewer',
  STAKEHOLDER: 'Stakeholder',
  OTHER: 'Other',
}

export const ENVIRONMENT_LABELS: Record<string, string> = {
  PROTOTYPE: 'Prototype',
  STAGING: 'Staging',
  PRODUCTION: 'Production',
  TRANSCRIPT_REVIEW: 'Transcript review',
  STATIC_RESPONSE_REVIEW: 'Static response review',
  OTHER: 'Other',
}

export const SESSION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  IN_PROGRESS: 'In progress',
  PAUSED: 'Paused',
  COMPLETE: 'Complete',
  ARCHIVED: 'Archived',
}

export const SESSION_STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-500',
  PAUSED: 'bg-yellow-500/10 text-yellow-500',
  COMPLETE: 'bg-green-500/10 text-green-500',
  ARCHIVED: 'bg-muted text-muted-foreground',
}

export const TOPIC_AREA_LABELS: Record<string, string> = {
  JOINING: 'Joining',
  BASIC_TRAINING: 'Basic Training',
  DAILY_LIFE: 'Daily Life',
  JOBS: 'Jobs',
  CAREERS: 'Careers',
  BENEFITS: 'Benefits',
  EDUCATION: 'Education',
  FAMILY: 'Family',
  SAFETY: 'Safety',
  ELIGIBILITY: 'Eligibility',
  MEDICAL: 'Medical',
  LEGAL: 'Legal',
  DEPLOYMENT: 'Deployment',
  CULTURE: 'Culture',
  MENTAL_HEALTH: 'Mental Health',
  HARASSMENT_OR_MISCONDUCT: 'Harassment / Misconduct',
  RECRUITER_PROCESS: 'Recruiter Process',
  OTHER: 'Other',
}

export const ISSUE_TYPE_LABELS: Record<string, string> = {
  ACCURACY: 'Accuracy',
  CONTENT_GAP: 'Content Gap',
  TONE: 'Tone',
  BRAND_SAFETY: 'Brand Safety',
  QUOTE_QUALITY: 'Quote Quality',
  CLARITY: 'Clarity',
  COMPLETENESS: 'Completeness',
  NEXT_STEP: 'Next Step',
  SENSITIVITY_HANDLING: 'Sensitivity',
  OUT_OF_SCOPE_HANDLING: 'Out-of-Scope Handling',
  AUTHENTICITY: 'Authenticity',
  TRUST: 'Trust',
  READABILITY: 'Readability',
  OVERPROMISING: 'Overpromising',
  MARKETING_SPEAK: 'Marketing Speak',
  POLICY_RISK: 'Policy Risk',
  PRIVACY_RISK: 'Privacy Risk',
  OTHER: 'Other',
}

export const ACTION_RECOMMENDATION_LABELS: Record<string, string> = {
  KEEP: 'Keep',
  EDIT: 'Edit',
  REWRITE: 'Rewrite',
  REPLACE_QUOTE: 'Replace Quote',
  ADD_CONTENT: 'Add Content',
  REMOVE_CONTENT: 'Remove Content',
  ESCALATE_FOR_REVIEW: 'Escalate for Review',
  VALIDATE_WITH_SME: 'Validate with SME',
  ADD_RECRUITER_REFERRAL: 'Add Recruiter Referral',
  ADD_OFFICIAL_SOURCE_REFERENCE: 'Add Official Source',
  ADD_NEXT_STEP: 'Add Next Step',
  SIMPLIFY_LANGUAGE: 'Simplify Language',
  MAKE_MORE_AUTHENTIC: 'Make More Authentic',
  REDUCE_MARKETING_LANGUAGE: 'Reduce Marketing',
  OTHER: 'Other',
}
