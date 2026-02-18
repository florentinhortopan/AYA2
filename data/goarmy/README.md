# GoArmy Jobs Crawl Data

This folder stores checked-in fallback data for the Job Finder experience.

## Files

- `jobs-crawl-latest.json`: stable fallback dataset used for fast retrieval/bootstrap.

## Update commands

- Refresh stable fallback:
  - `npm run crawl:goarmy:jobs -- 80`
- Refresh fallback and also keep a timestamped snapshot:
  - `npm run crawl:goarmy:jobs -- 80 --snapshot`

## Why this is checked in

- Faster UX on first load (no mandatory crawl before testing pages).
- Predictable fallback for demos, QA, and local development.
- Baseline retrieval data available even when live crawl is not run.
