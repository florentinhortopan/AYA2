# Merged Context

This document merges the relevant state from recent agent workstreams so future implementation can continue from one source of truth.

## Current Baseline

- Branch: `main`
- Remote: `origin/main`
- Immersive feature set has been integrated into `main`.
- Segue pills research-lab functionality is also on `main`.

## Implemented Immersive Experience

- Full-page immersive route:
  - `app/content/[projectId]/immersive/page.tsx`
- Scene contract and orchestration:
  - `lib/content/immersive/scene-orchestrator.ts`
- Data adapters for RAG/jobs/video:
  - `lib/content/immersive/data-adapters.ts`
- Immersive UI components:
  - `components/content/immersive/scene-canvas.tsx`
  - `components/content/immersive/chat-overlay.tsx`
  - `components/content/immersive/voice-controls.tsx`
- Immersive API endpoint:
  - `app/api/content-tool/projects/[projectId]/immersive-chat/route.ts`

## Supporting Updates

- Workspace entry added for immersive route:
  - `app/content/[projectId]/page.tsx`
- Top navigation includes `Immersive` entry for signed-in users:
  - `components/layout/navbar.tsx`

## Known Follow-Up Context

- A TypeScript narrowing fix was applied in immersive page response handling so build type-check does not fail on union payload access.
- Baseline browser mapping warning is non-blocking; update can be done later with:
  - `npm i baseline-browser-mapping@latest -D`

## Product Behavior Clarification

- Videos are backend-selected when relevant and then rendered in canvas.
- Users do not need to manually add URLs during chat.
- If no relevant video is selected for a turn, no video plays for that turn (intended behavior).

