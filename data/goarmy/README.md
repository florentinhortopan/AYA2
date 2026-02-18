# GoArmy Jobs Crawl Data

This folder stores checked-in fallback data for the Job Finder experience.

## Files

- `jobs-crawl-latest.json`: stable fallback dataset used for fast retrieval/bootstrap.

## Update commands

- Refresh stable fallback:
  - `npm run crawl:goarmy:jobs -- 80`
- Refresh fallback and also keep a timestamped snapshot:
  - `npm run crawl:goarmy:jobs -- 80 --snapshot`
- Enforce full scoped-label coverage (fails if missing labels):
  - `npm run crawl:goarmy:jobs -- 180 --strict-coverage`

## Why this is checked in

- Faster UX on first load (no mandatory crawl before testing pages).
- Predictable fallback for demos, QA, and local development.
- Baseline retrieval data available even when live crawl is not run.

## Coverage and component maps

The crawler output now includes:

- `coverage`: found/missing scoped labels and percentage coverage
- `componentBlocks` for each page:
  - inferred block type (`hero`, `table`, `list`, `media-grid`, `cta`, `text`)
  - positional index
  - extracted lists/tables/links/images
  - lightweight style hints (`class` list + source HTML tag)

This is the foundation for deriving reusable design modules inside the chatbot.
