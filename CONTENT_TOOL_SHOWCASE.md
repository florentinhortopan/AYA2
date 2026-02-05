# AYA Content Tool — Workflow Upgrade (Q&A Studio)

**What it is**  
A unified content ops workspace to generate, edit, validate, and export structured Q&A content—now faster, safer, and fully collaborative.

## Highlights
- **End‑to‑end pipeline** from prompt → generation → review → export.
- **DB‑backed prompts & guidelines** so operators can edit, version, and reuse prompt assets.
- **Structured output** mapped to the DB schema for reliable ingestion.
- **Approval + rating controls** at the question and answer level with instant DB updates.

## Workflow Improvements
1. **Prompt & Guideline Editors**
   - Inline Markdown editor with **preview** + **format** toggle.
   - “Save” and “Save as New” versions to build a reusable library.

2. **Project + Prompt Workflow (Multi‑Ops)**
   - Projects link to **active prompt + guideline versions**, so multiple operators can work in parallel with consistent inputs.
   - Operators can switch prompts/guidelines per project without code changes.
   - Updates are persisted and visible across sessions.

3. **Generation that sticks**
   - **Questions and Answers are persisted** to the database.
   - Refresh‑safe: data remains after reloads.
   - **Answers are linked to questions** for clean project structure.

4. **Operator Controls**
   - Inline **edit** for questions/answers.
   - **Status + rating dropdowns** for review workflows.
   - Optimistic UI with error handling for safe updates.

5. **Exports that reflect approvals**
   - CSV / JSON / Markdown export filtered by **question & answer status**.
   - Export filenames use the **project’s friendly name + date**.

6. **Sandbox Chatbot for QA Testing**
   - Floating **project chatbot** available across the workspace.
   - Pulls **live project data** and only responds from approved content.
   - **Tone‑aware**: detects the user’s mood and selects the best answer variant, so we can prototype real interaction styles and UX.

## Why it matters
- **Less manual cleanup**: schema‑ready outputs from the start.
- **Faster approvals**: inline status/rating changes with real‑time updates.
- **Collaborative ops**: prompt libraries + project‑based workflows keep teams aligned.
- **Real‑world testing**: the chatbot simulates user tone and response quality.

## Result
A production‑ready, operator‑friendly Q&A pipeline that is **accurate, editable, collaborative, and export‑ready**—plus a live chatbot sandbox to test real user interactions.
