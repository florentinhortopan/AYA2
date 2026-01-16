# Content Tool Strategy

## Purpose
Create a dedicated workflow to generate, edit, validate, and publish Q&A content using the dual-prompt flow (Question Generator + Answer Generator) while fitting the current Next.js + Prisma stack and UI patterns.

## Core Outcomes
- Single place for content professionals to run the dual-prompt pipeline end to end.
- Editable tables for questions and answers with validation feedback.
- Batch processing with progress tracking and resumable state.
- Clear audit trail and publishing gate.

## Users & Access
- Content professional: creates projects, runs prompts, edits content.
- SME reviewer: validates accuracy, marks issues.
- Manager: publishes, archives.

Suggested access model: gate this feature behind authenticated users and a “recruiter/content” role (or reuse the existing “Recruiter View” entry point and extend it).

## Information Architecture
- New top-level area under main navigation for registered users: **Content**.
  - Example routes:
    - `app/content/page.tsx` (Projects list)
    - `app/content/new/page.tsx` (Project wizard)
    - `app/content/[projectId]/page.tsx` (Project workspace)
    - `app/content/[projectId]/questions/page.tsx`
    - `app/content/[projectId]/answers/page.tsx`
    - `app/content/[projectId]/batch/page.tsx`
    - `app/content/[projectId]/validate/page.tsx`
    - `app/content/[projectId]/publish/page.tsx`
    - `app/content/prompts/page.tsx`
    - `app/content/guidelines/page.tsx`

## Key UI Surfaces
- **Projects dashboard**
  - Project list, status, counts, quick actions.
- **Project wizard**
  - Create project (name, target count, corpus upload, prompt versions).
- **Question editor**
  - Editable table (topic/persona/tone/question/status/source URLs).
  - Batch selection and “Generate Answers” action.
  - Rating column with default value set after generation.
- **Answer variants view**
  - Four variants per question, selection, validation flags, source link.
  - Rating control per answer variant with default value set after generation.
- **Batch processing view**
  - Progress by batch, retry controls, history.
- **Validation & publish**
  - Issues panel, approval workflow, publish action, export options.
- **Prompt editor**
  - Edit Question Generator and Answer Generator prompts in-app.
  - Store versions, allow selecting active prompt per project.
- **Guideline editor**
  - Edit the guideline text file in-app.
  - Store versions, allow selecting active guideline per project.
  - Validate active prompt + guideline presence before generation.

Use the existing UI component library under `components/ui` (cards, tables, badges, dialogs, tabs, progress, buttons). Prefer consistent layout with current pages (container, card grids, tables).

## Data Model (Planned)
Introduce new Prisma models aligned with the guide but adapted to current schema:
- `QaProject`
  - name, description, status, corpusFileId, prompt versions, target count, timestamps.
- `QaQuestion`
  - projectId, topic, persona, tone, questionText, sourceUrls, status, batchNumber, validated flags.
  - ratingDefault, ratingValue, ratingUpdatedBy, ratingUpdatedAt.
- `QaAnswer`
  - questionId, variantLevel, answerText, characterCount, keywords, sourceLink, validation status, notes.
  - ratingDefault, ratingValue, ratingUpdatedBy, ratingUpdatedAt.
- `CorpusFile`
  - name, content, hash, sourceUrls, createdBy, isActive.
- `BatchJob`
  - projectId, batchNumber, promptType, status, apiResponse, error, timestamps.
- `ContentAuditLog`
  - projectId, questionId, answerId, actionType, old/new value, actor.
- `PromptTemplate`
  - name, type (question_generator | answer_generator), content, version, isActive, createdBy, updatedAt.
- `GuidelineTemplate`
  - name, content, version, isActive, createdBy, updatedAt.

Decision: keep these models separate from `Content` (UGC) to avoid mixing recruiter-managed content with community content.

## Backend API Strategy
Use Next.js route handlers under `app/api` with similar validation patterns as `app/api/actions/route.ts`:
- Projects
  - `POST /api/content-tool/projects`
  - `GET /api/content-tool/projects`
  - `GET /api/content-tool/projects/:projectId`
  - `PUT /api/content-tool/projects/:projectId`
- Corpus
  - `POST /api/content-tool/corpus`
  - `GET /api/content-tool/corpus`
- Questions
  - `POST /api/content-tool/projects/:projectId/questions`
  - `GET /api/content-tool/projects/:projectId/questions`
  - `PUT /api/content-tool/questions/:questionId`
- Answers
  - `POST /api/content-tool/questions/:questionId/answers`
  - `GET /api/content-tool/questions/:questionId/answers`
  - `PUT /api/content-tool/answers/:answerId`
- Prompts
  - `GET /api/content-tool/prompts`
  - `POST /api/content-tool/prompts`
  - `PUT /api/content-tool/prompts/:promptId`
- Guidelines
  - `GET /api/content-tool/guidelines`
  - `POST /api/content-tool/guidelines`
  - `PUT /api/content-tool/guidelines/:guidelineId`
- Prompt execution
  - `POST /api/content-tool/prompts/questions/execute`
  - `POST /api/content-tool/prompts/answers/execute`
- Validation
  - `POST /api/content-tool/validation/corpus-check`
  - `POST /api/content-tool/validation/batch`
- Publishing
  - `POST /api/content-tool/projects/:projectId/publish`
  - `GET /api/content-tool/projects/:projectId/export?format=csv|json|md`

## Prompt Execution Strategy
- Use the existing `lib/ai.ts` service with a specialized wrapper for non-chat prompts.
- Store prompt templates in the database with versioning and allow selecting active prompts per project.
- Store guideline templates in the database with versioning and allow selecting active guideline per project.
- Normalize all prompt outputs to strict markdown tables before parsing.

## Parsing & Validation
- Build a table parser utility to convert markdown tables to rows with schema checks.
- Enforce 25-question batch size for answer generation.
- Apply default ratings immediately after generation for questions and answers.
- Validate presence of selected prompts and guideline before execution.
- Validation engine:
  - keyword extraction + similarity checks vs. corpus
  - status mapping: valid / needs_review / invalid

## Batch Processing
- Store batch job state in `BatchJob` to allow resume.
- Process sequentially by default; allow limited concurrency later.
- Emit progress updates via polling initially; WebSockets can be added later.

## Publishing Flow
- Require all questions to be approved and selected answer variant present.
- Require rating values to be set (default or updated) for questions and answers.
- Write final “published” Q&A records to a dedicated table or existing “Content” depending on product direction.
- Log every change in `ContentAuditLog`.

## Implementation Phases
1. **Foundations**: Prisma models + CRUD endpoints.
2. **Prompt integration**: question gen, answer gen, table parser.
3. **Editors**: questions table + answers table + variant selector.
4. **Validation**: corpus upload + validation endpoint + UI flags.
5. **Batch processing**: job tracking + progress UI.
6. **Publishing**: approval workflow, export, audit logs.

## Risks & Guardrails
- Prompt output format drift: enforce strict parsing rules and error reporting.
- LLM cost/rate limits: add caching and batch throttling.
- Data correctness: corpus validation must be explicit and visible.
- Rating misuse: document score meaning and enforce valid ranges in API validation.

## First UI Wireframe (Text)
- Projects list → create project wizard → question grid → batch answers → variant selection → validation → publish.

## UI Route Map (Detailed)
- `/content`: Projects dashboard
- `/content/new`: Project wizard
- `/content/[projectId]`: Workspace overview
- `/content/[projectId]/questions`: Question editor
- `/content/[projectId]/answers`: Answer variants editor
- `/content/[projectId]/batch`: Batch processing
- `/content/[projectId]/validate`: URL + corpus validation
- `/content/[projectId]/publish`: Approval + publish
- `/content/prompts`: Prompt library + editor
- `/content/guidelines`: Guideline library + editor

## API Surface (Detailed)
- Projects: `POST/GET/PUT /api/content-tool/projects`
- Corpus: `POST/GET /api/content-tool/corpus`
- Questions: `POST/GET /api/content-tool/projects/:projectId/questions`, `PUT /api/content-tool/questions/:questionId`
- Answers: `POST/GET /api/content-tool/questions/:questionId/answers`, `PUT /api/content-tool/answers/:answerId`
- Prompts: `GET/POST/PUT /api/content-tool/prompts`
- Guidelines: `GET/POST/PUT /api/content-tool/guidelines`
- Prompt execution: `POST /api/content-tool/prompts/questions/execute`, `POST /api/content-tool/prompts/answers/execute`
- Validation: `POST /api/content-tool/validation/url-check`, `POST /api/content-tool/validation/corpus-check`
- Publish/export: `POST /api/content-tool/projects/:projectId/publish`, `GET /api/content-tool/projects/:projectId/export`

## Repo Mapping
- UI pages: `app/content/...`
- API routes: `app/api/content-tool/...`
- Shared utilities: `lib/content/*`
- Types: `types/content.ts`
- New UI components: `components/content/*` (tables, modals, batch status)

## Ideal Operator Workflow
1. Confirm active Question Generator prompt, Answer Generator prompt, and guideline file.
2. Launch question generation batch; monitor processing.
3. Review generated questions, edit inline, adjust ratings.
4. Select question batches and run answer generation.
5. Review answer variants, edit inline, adjust ratings.
6. Validate source URL accessibility and relevance per answer.
7. Review tone/persona annotations and create or refine variants as needed.
8. Resolve validation flags, approve final variants, publish/export.

## Near-Term Decisions Needed
- Whether to store published Q&A in its own table or reuse `Content`.
- Corpus storage location (DB vs. file store).
- Guideline versioning rules (single active vs. per project selection).

