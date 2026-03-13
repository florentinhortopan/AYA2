# GoArmy Media Ingest Runbook

This runbook keeps GoArmy crawl data, corpus text, and media rows in sync for immersive retrieval.

## Prerequisites

- `DATABASE_URL` and `DIRECT_URL` set.
- Dependencies installed (`npm install`).
- Prisma client generated (`npm run db:generate` or postinstall).

## Commands

- Crawl fresh GoArmy pages:
  - `npm run crawl:goarmy`
- Ingest latest crawl into corpus + `KnowledgeSourcePage` + `KnowledgeSourceMedia`:
  - `npm run ingest:goarmy-media`
- Run both sequentially:
  - `npm run sync:goarmy`

Optional:
- Dry-run ingest write path (no DB source-page/media writes):
  - `npm run ingest:goarmy-media -- --dry-run`

## What Gets Written

`scripts/ingest-goarmy-jobs-to-rag.ts` now updates:

1. `CorpusFile` (`goarmy-jobs-corpus-latest`)
2. `QaProject` (`GoArmy Jobs Knowledge Base`)
3. `KnowledgeSourcePage` (per crawled URL):
   - `slug`, `section`, `status`, `textContent`, `checksum`, `scrapedAt`
4. `KnowledgeSourceMedia` (per page):
   - image/video URLs from page-level and block-level extraction
   - metadata in `data`:
     - `pageSlug`
     - `section`
     - `matchedLabels`
     - `topicHints`
     - `confidence`
     - `source: goarmy-crawl`

## Validation Checklist

After `npm run sync:goarmy`:

1. Confirm crawl output exists:
   - `data/goarmy/jobs-crawl-latest.json`
2. Confirm DB has source pages:
   - `KnowledgeSourcePage` rows with non-null `slug` and `section`
3. Confirm DB has media:
   - `KnowledgeSourceMedia` rows for `mediaType = image` and `mediaType = video`
4. Confirm immersive endpoint response includes mixed cards:
   - `image`, `video`, `table`, `job` as available
5. Confirm chat/canvas split:
   - chat text follows Q&A answer
   - canvas cycles rich cards between turns

## Notes

- Decorative assets are filtered during ingest (logos/icons/sprites/svg).
- Media dedupe is applied by source URL per page.
- If no media matches a prompt, immersive retrieval falls back to support cards and CTA.
