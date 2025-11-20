# Database Setup Guide

## Option 1: Using Vercel Postgres (Recommended for Production)

### Step 1: Create a Vercel Project (if not done yet)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. You can import from Git later, but for now, just create the project manually

### Step 2: Create a Postgres Database

1. In your Vercel dashboard, go to the **Storage** tab
2. Click **Create Database**
3. Select **Postgres**
4. Choose a name for your database (e.g., `ayaya2-db`)
5. Select a region closest to your users
6. Click **Create**

### Step 3: Get Your Connection Strings

After creating the database:

1. Go to the **Storage** tab in your Vercel dashboard
2. Click on your Postgres database
3. Go to the **.env.local** tab
4. You'll see several environment variables:
   - `POSTGRES_URL` - Pooled connection (for serverless)
   - `POSTGRES_PRISMA_URL` - Prisma connection string
   - `POSTGRES_URL_NON_POOLING` - Direct connection (for migrations)
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

### Step 4: Set Up Local Environment Variables

Create a `.env` file in your project root (it's already in .gitignore):

```bash
# Copy the values from Vercel dashboard
POSTGRES_URL="postgresql://..."
POSTGRES_PRISMA_URL="postgresql://..."
POSTGRES_URL_NON_POOLING="postgresql://..."

# For Prisma, use the Prisma URL
DATABASE_URL="${POSTGRES_PRISMA_URL}"
DIRECT_URL="${POSTGRES_URL_NON_POOLING}"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 5: Run Database Migrations Locally

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to Vercel Postgres (creates tables)
npx prisma db push

# Or use migrations for production
npx prisma migrate dev --name init
```

### Step 6: Verify Connection

```bash
# Open Prisma Studio to view your database
npx prisma studio
```

This will open a web interface at `http://localhost:3001` where you can view and edit your database.

---

## Option 2: Local PostgreSQL (For Development Only)

If you prefer to use a local PostgreSQL instance first:

### Install PostgreSQL Locally

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from [postgresql.org](https://www.postgresql.org/download/windows/)

### Create Local Database

```bash
# Create a database
createdb ayaya2_db

# Or using psql
psql postgres
CREATE DATABASE ayaya2_db;
\q
```

### Update .env File

```bash
# Local PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/ayaya2_db?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/ayaya2_db?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

Replace `username` and `password` with your PostgreSQL credentials.

### Run Migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

---

## Setting Up Vercel Environment Variables

When you're ready to deploy to Vercel:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add the following variables:

```
DATABASE_URL = (from Vercel Postgres .env tab)
DIRECT_URL = POSTGRES_URL_NON_POOLING (from Vercel Postgres)
NEXTAUTH_SECRET = (generate with openssl rand -base64 32)
NEXTAUTH_URL = https://your-app.vercel.app
GOOGLE_CLIENT_ID = (if using Google OAuth)
GOOGLE_CLIENT_SECRET = (if using Google OAuth)
```

4. Make sure to add them for **Production**, **Preview**, and **Development** environments
5. After adding variables, redeploy your app

---

## Important Notes

1. **Don't commit `.env` file** - It's already in `.gitignore`
2. **Use Vercel Postgres URLs** - The connection strings from Vercel are optimized for serverless
3. **DIRECT_URL** - Required for Prisma migrations. Use `POSTGRES_URL_NON_POOLING` from Vercel
4. **Production Migrations** - Run `npx prisma migrate deploy` after deploying to production

---

## Troubleshooting

### Connection Issues
- Make sure your IP is allowed (Vercel Postgres is accessible from anywhere)
- Check that environment variables are correctly set
- Verify the connection string format

### Migration Issues
- Use `DIRECT_URL` for migrations, not the pooled connection
- Make sure Prisma Client is generated: `npx prisma generate`
- Check Prisma schema syntax

### Still Having Issues?
- Check Vercel Postgres logs in the dashboard
- Run `npx prisma studio` to verify database connection
- Verify your `.env` file is in the project root

