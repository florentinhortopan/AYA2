# AI Agent Setup Guide

## Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (you won't be able to see it again!)

## Setting Up for Vercel Deployment

### Step 1: Add Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter:
   - **Variable Name**: `OPENAI_API_KEY`
   - **Value**: Paste your OpenAI API key
   - **Environments**: Select all (Production, Preview, Development)
5. Click **Save**

### Step 2: Redeploy

After adding the environment variable, you need to redeploy:

1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

## Setting Up for Local Development

Add the API key to your `.env` file in the project root:

```bash
OPENAI_API_KEY="sk-your-api-key-here"
```

Then restart your development server:

```bash
npm run dev
```

## Verifying It Works

1. Visit your app (or `http://localhost:3000` locally)
2. Go to `/explore/recruitment`
3. Send a message like "Tell me about career paths"
4. You should get an AI-generated response with rich UI components (buttons, cards, etc.)

## Current Status

- ✅ **Recruitment Agent**: Fully integrated with OpenAI
- ⏳ **Training Agent**: Ready for AI integration (uses placeholder)
- ⏳ **Financial Agent**: Ready for AI integration (uses placeholder)
- ⏳ **Educational Agent**: Ready for AI integration (uses placeholder)

## Customizing Agent Prompts

To customize agent behavior, edit the configuration files:

- **Recruitment**: `agents/config/recruitment.ts`
  - Modify `systemPrompt` for agent personality
  - Update `guidelines` for response structure
  - Adjust `uiPrompts` for UI component generation
  - Add/remove `ctaActions` for buttons

## AI Model Configuration

By default, the app uses `gpt-4o-mini` (cost-effective). To change:

Edit `lib/ai.ts` and update the model:

```typescript
private model: string = 'gpt-4o' // or 'gpt-3.5-turbo'
```

## Troubleshooting

### "Please configure OPENAI_API_KEY"
- Make sure the environment variable is set in Vercel
- Redeploy after adding the variable
- Check that the key is valid and has credits

### Agent returns placeholder responses
- Verify the API key is correct
- Check Vercel deployment logs for errors
- Ensure you've redeployed after adding the key

### API errors
- Check your OpenAI account has credits
- Verify the API key hasn't been revoked
- Check rate limits on your OpenAI plan

