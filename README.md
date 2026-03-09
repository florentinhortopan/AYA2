# AYA2

AYA2 is a Next.js app for AI-assisted workflows, content tooling, and segue-pill experimentation.

## Quick Start

### 1) Prerequisites

- Node.js `18+` (Node `20+` recommended)
- npm
- PostgreSQL database

### 2) Install dependencies

```bash
npm install
```

### 3) Configure environment variables

Create or edit `.env.local` (or `.env`) in the project root:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
NEXTAUTH_SECRET="replace-with-random-secret"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."
```

Optional (only if using Google OAuth):

```bash
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

Generate a secret:

```bash
openssl rand -base64 32
```

### 4) Set up database

For local development, either push schema or run migrations:

```bash
npm run db:generate
npm run db:push
```

If you prefer migration flow:

```bash
npm run db:migrate
```

### 5) Run development server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Common Commands

```bash
npm run dev          # start local dev server
npm run build        # production build (includes prisma generate)
npm run start        # run production server
npm run lint         # lint app
npm run type-check   # TypeScript check
npm run db:studio    # Prisma Studio
```

## Job Finder Data Scripts

```bash
npm run crawl:goarmy:jobs
npm run ingest:goarmy:jobs
```

## Notes

- This repo already includes `.env` and `.env.local` files locally, but contributors should create their own local values.
- If Prisma types are out of sync after schema changes, run:

```bash
npm run db:generate
```
