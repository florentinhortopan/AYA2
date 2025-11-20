# Quick Start Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Vercel Postgres

1. Go to [vercel.com](https://vercel.com) → **Storage** → **Create Database** → **Postgres**
2. Name it (e.g., `ayaya2-db`) and select a region
3. Click **Create**

## Step 3: Get Connection Strings

1. In your Vercel Postgres database, go to the **.env.local** tab
2. Copy the connection strings

## Step 4: Create `.env` File

Create a `.env` file in the project root:

```bash
# From Vercel Postgres - use POSTGRES_PRISMA_URL
DATABASE_URL="postgresql://..."

# From Vercel Postgres - use POSTGRES_URL_NON_POOLING  
DIRECT_URL="postgresql://..."

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="paste-generated-secret-here"

NEXTAUTH_URL="http://localhost:3000"

# Optional: Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

## Step 5: Generate Prisma Client

```bash
npm run db:generate
```

## Step 6: Push Schema to Database

```bash
npm run db:push
```

This creates all the tables in your Vercel Postgres database.

## Step 7: Test Database Connection

```bash
npm run db:test
```

This will verify:
- ✅ Database connection works
- ✅ All tables are created correctly
- ✅ You can query the database

## Step 8: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Optional: View Database in Browser

```bash
npm run db:studio
```

Opens Prisma Studio at `http://localhost:5555` - a visual database browser.

---

## Troubleshooting

### "Can't reach database server"
- Check your `.env` file has correct `DATABASE_URL` and `DIRECT_URL`
- Verify connection strings from Vercel are copied correctly
- Make sure there are no extra quotes or spaces

### "Prisma Client not generated"
- Run: `npm run db:generate`

### "Tables don't exist"
- Run: `npm run db:push`

### Still having issues?
- Check `DATABASE_SETUP.md` for detailed troubleshooting
- Verify your Vercel Postgres database is running (check Vercel dashboard)

