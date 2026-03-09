# Job Finder Assistant Implementation Plan

## Goal
Ship a fifth assistant (`job-finder`) and a dedicated `/explore/find-a-job` experience that:

1. Mirrors the jobs journey from GoArmy job sections.
2. Uses retrieval-backed answers with source citations.
3. Supports rich media in chat (phase 1: YouTube + images, runtime charts).
4. Prepares schema and ingestion flow for chart JSON payload ingestion in phase 2.

## Confirmed Inputs

- Assistant type name: `job-finder` (kept for safety and compatibility).
- Scope for scraping and knowledge ingestion (initial):
  - Career Paths / Find Your Path
  - Enlisted Soldiers / Army Officers / OCS / Warrant Officers / Army Civilian Careers
  - College Path / ROTC / ROTC Scholarships / West Point / Green to Gold
  - Medical Path / Army Medical / Medical Scholarships / Medical Training
  - Specialized Paths / Specialty Jobs / Army Law / Chaplain / Cyber / Aviation / Bands
  - Special Operations / Rangers / Special Forces / Psychological Operations / Civil Affairs
  - Career Development / Army Career Match / Job Training / AIT / Leadership Training
- Media sequencing:
  - Phase 1: YouTube + images + runtime chart generation.
  - Phase 2: ingest chart payloads from pages as JSON media type.

## Architecture Phases

## Phase 0 - Completed Baseline

- Added `job-finder` assistant type and cloned agent behavior.
- Added dedicated route `app/explore/find-a-job/page.tsx`.
- Added fifth assistant card in `app/explore/page.tsx`.

## Phase 1 - UX Shell and Navigation (current sprint)

- Design modular page sections to match jobs taxonomy and flow.
- Introduce data-driven modules that can be hydrated from ingestion results.
- Keep chatbot embedded and connected to `job-finder`.
- Add published-page cards with in-app links as soon as content pages exist.

## Phase 2 - Focused Crawler + Structured Content

- Build jobs-only crawler with allowlist constraints.
- Normalize pages into:
  - metadata (title, slug, canonical URL, section type)
  - content blocks (headings, paragraphs, list items)
  - extracted media refs (image/video URLs)
  - outgoing internal links
- Add dedupe/versioning (URL + content hash).

## Phase 3 - RAG Upgrade for Job Finder

- Keep current lexical matching as fallback.
- Add chunk retrieval with embeddings and metadata filtering.
- Include source URL references in every job answer when available.
- Add reranking and confidence threshold behavior.

## Phase 4 - Media in Chat (Phase 1)

- Extend response UI types and renderer for:
  - `image`
  - `video` (YouTube embeds or links)
  - `chart` (runtime generated config/data)
- Update assistant prompt constraints to return supported media payloads.
- Add safe rendering rules and responsive layout.

## Phase 5 - Chart JSON Ingestion (Phase 2)

- Add chart media schema type for stored chart payloads.
- Parse/ingest chart-like structures from scraped pages where available.
- Prefer stored chart JSON when source provides it; otherwise runtime chart generation remains fallback.

## Data/Schema Direction

- Current Q&A supports `sourceLink`, but no dedicated media model.
- Proposed additions in a migration:
  - `QaAnswerMedia` (answer-linked media records)
  - `SourcePage` (normalized ingested page model)
  - Optional `SourceChunk` for retrieval indexing metadata
- Keep schema additive and backward compatible.

## Milestones

1. UI shell complete and navigable.
2. Jobs-scope crawler fills normalized source table.
3. Retrieval switched from lexical-only fallback to hybrid retrieval.
4. Media rendering enabled in chat responses.
5. Chart JSON ingestion enabled without breaking runtime chart generation.
