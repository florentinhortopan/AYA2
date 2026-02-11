-- Migration: Unify Question and Answer Status Options
-- This migration documents the unification of status options for questions and answers.
-- No schema changes are required as both fields are String types that accept any value.
-- This ensures no data loss while allowing both questions and answers to use the same status values.

-- Status values now supported for both QaQuestion.status and QaAnswer.validationStatus:
-- - draft
-- - pending
-- - approved
-- - rejected
-- - published
-- - valid
-- - needs_review
-- - invalid

-- Note: Existing data remains unchanged. The application layer now accepts all status values
-- for both questions and answers, providing consistency across the content management system.

-- No ALTER TABLE statements needed - String fields already support all these values.
