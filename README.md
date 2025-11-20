# AYAYA2 - AAA Recruitment Platform

A comprehensive AI-powered platform for army recruitment, offering personalized career paths, training resources, financial guidance, and educational support.

## Features

### For Unregistered Users (No Account Required)
- 🤖 **AI Agent Interactions**: Chat with recruitment, training, financial, and educational assistants
- 🎯 **Personalized Career Paths**: Get recommendations based on your interests
- 💪 **Training Resources**: Access physical and mental training guidance
- 💰 **Financial Information**: Learn about military benefits and financial planning
- 📚 **Educational Resources**: Explore educational opportunities and training programs

### For Registered Users
- ✅ Everything above, plus:
- 👥 **User-Generated Content**: Access community guides, reviews, tips, and stories
- 📊 **Progress Tracking**: Track your training, career development, and achievements
- 🏆 **Gamification**: Earn achievements and level up across different categories
- 💬 **Community Features**: Engage with other users and share experiences
- 📈 **Detailed Analytics**: Monitor your progress with detailed insights

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Vercel Postgres)
- **Authentication**: NextAuth.js
- **UI**: shadcn/ui + Tailwind CSS
- **Deployment**: Vercel

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── agents/        # Agent interaction endpoints
│   │   └── auth/          # Authentication endpoints
│   ├── explore/           # Public exploration pages
│   └── [routes]/          # Other app routes
├── agents/                # Modular AI agent system
│   ├── base.ts           # Base agent class
│   ├── recruitment.ts    # Recruitment agent
│   ├── training.ts       # Training agent
│   ├── financial.ts      # Financial agent
│   ├── educational.ts    # Educational agent
│   └── index.ts          # Agent factory
├── components/           # React components
│   └── ui/              # shadcn/ui components
├── lib/                 # Utility functions
│   ├── db.ts           # Database client
│   ├── auth.ts         # Auth configuration
│   └── utils.ts        # General utilities
├── prisma/             # Database schema
│   └── schema.prisma   # Prisma schema
└── types/              # TypeScript types
    └── index.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or Vercel Postgres)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

### Local PostgreSQL

Update your `.env` file:
```
DATABASE_URL="postgresql://user:password@localhost:5432/ayaya2_db?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/ayaya2_db?schema=public"
```

### Vercel Postgres

1. Create a Postgres database in your Vercel dashboard
2. Vercel will automatically set the connection strings as environment variables
3. Run migrations:
```bash
npx prisma migrate deploy
```

## Deployment to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your project in Vercel
3. Configure environment variables in Vercel dashboard
4. Vercel will automatically detect Next.js and deploy

### Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct PostgreSQL connection (for migrations)
- `NEXTAUTH_SECRET` - Secret for NextAuth.js (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your app URL (e.g., `https://your-app.vercel.app`)
- `GOOGLE_CLIENT_ID` - (Optional) For Google OAuth
- `GOOGLE_CLIENT_SECRET` - (Optional) For Google OAuth

## Agent System

The platform uses a modular agent architecture:

- **RecruitmentAgent**: Career path exploration and recommendations
- **TrainingAgent**: Physical and mental training programs
- **FinancialAgent**: Benefits and financial planning
- **EducationalAgent**: Educational opportunities and skill development

Each agent can be extended with actual AI integration (OpenAI, Anthropic, etc.) in the future.

## Development

### Type Checking
```bash
npm run type-check
```

### Database Management
```bash
# Generate Prisma Client after schema changes
npm run db:generate

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

## License

MIT

# Last updated: Thu Nov 20 14:21:23 PST 2025
