import OpenAI from 'openai'
import { RichAgentResponse, AnyUIComponent } from '@/types/ui'
import { AgentType } from '@/types'
import { personalizeGuidelines } from './guideline-personalizer'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

interface AIPromptConfig {
  systemPrompt: string
  guidelines?: Record<string, unknown>
  uiPrompts?: Record<string, string>
  agentType?: AgentType // Add agent type for personalization
}

interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export class AIService {
  private model: string = 'gpt-4o-mini' // Cost-effective default, can be configured

  async generateResponse(
    messages: AIMessage[],
    config: AIPromptConfig,
    context?: Record<string, unknown>
  ): Promise<string> {
    if (!process.env.OPENAI_API_KEY) {
      // Fallback to placeholder if no API key
      return this.getPlaceholderResponse(messages, config)
    }

    try {
      const systemMessage: AIMessage = {
        role: 'system',
        content: this.buildSystemPrompt(config, context)
      }

      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 1000,
      })

      return response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'
    } catch (error) {
      console.error('AI API error:', error)
      return this.getPlaceholderResponse(messages, config)
    }
  }

  async generateRichResponse(
    messages: AIMessage[],
    config: AIPromptConfig,
    context?: Record<string, unknown> | { [key: string]: unknown }
  ): Promise<RichAgentResponse> {
    if (!process.env.OPENAI_API_KEY) {
      return this.getPlaceholderRichResponse(messages, config)
    }

    try {
      const systemMessage: AIMessage = {
        role: 'system',
        content: this.buildRichSystemPrompt(config, context)
      }

      // Request structured output with JSON schema for UI components
      const response = await openai.chat.completions.create({
        model: this.model,
        messages: [
          systemMessage,
          ...messages,
          {
            role: 'system',
            content: `IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "text": "Your main text response here",
  "components": [
    {
      "type": "table",
      "props": {
        "title": "Benefits Breakdown",
        "headers": ["Benefit", "Description", "Value"],
        "rows": [
          ["GI Bill", "Education benefits", "$4,500/year"],
          ["Housing", "BAH allowance", "Varies by location"]
        ]
      }
    },
    {
      "type": "timeline",
      "props": {
        "title": "Career Path Timeline",
        "milestones": [
          {
            "title": "Basic Training",
            "date": "Weeks 1-10",
            "status": "upcoming",
            "links": [
              {"label": "Preparation Guide", "href": "/guides/basic-training", "type": "resource"}
            ]
          }
        ]
      }
    }
  ],
  "segues": [
    {
      "type": "segue",
      "props": {
        "label": "Explore similar benefits",
        "action": "explore_benefits",
        "sentiment": "exploratory",
        "context": "User asked about benefits"
      }
    }
  ],
  "metadata": {
    "type": "response_type",
    "sentiment": "informative",
    "context": {}
  }
}

Available component types:
- text, button, card, list, badge, alert, accordion (basic)
- table: For structured data like benefits breakdowns, comparisons
- timeline: For career paths, training schedules with milestones and resource links
- matrix: For comparisons, feature matrices (e.g., career path comparison)
- segue: Context-aware buttons based on conversation sentiment and previous inputs

When to use components:
- Tables: Benefits breakdowns, requirements lists, comparison data
- Timelines: Career paths, training programs, application processes with milestones
- Matrices: Side-by-side comparisons (e.g., career paths, benefit tiers)
- Segues: Add natural follow-up actions based on what user said or showed interest in

Generate segues based on:
- User's sentiment (curious, interested, confused, ready to act)
- Previous questions/inputs in conversation
- Natural conversation flow (what would they likely want to explore next?)

Use components to make responses interactive and engaging.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        try {
          const parsed = JSON.parse(content)
          return this.validateRichResponse(parsed)
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError)
        }
      }

      // Fallback to text-only response
      return {
        text: content || this.getPlaceholderResponse(messages, config),
        components: [],
        segues: []
      }
    } catch (error) {
      console.error('AI API error:', error)
      return this.getPlaceholderRichResponse(messages, config)
    }
  }

  private buildSystemPrompt(
    config: AIPromptConfig,
    context?: Record<string, unknown>
  ): string {
    let prompt = config.systemPrompt + '\n\n'

    // Personalize guidelines based on user context if available
    let guidelines = config.guidelines
    if (config.guidelines && config.agentType && context?.enhancedContext) {
      const enhancedContext = context.enhancedContext as any
      guidelines = personalizeGuidelines(
        config.guidelines as Record<string, any>,
        config.agentType,
        {
          profile: enhancedContext.profile,
          insights: enhancedContext.insights,
          sentiment: enhancedContext.sentiment
        }
      )
    }

    if (guidelines) {
      prompt += 'Personalized Guidelines:\n' + JSON.stringify(guidelines, null, 2) + '\n\n'
    }

    // Use enhanced context if available, otherwise fall back to basic profile
    if (context?.enhancedContext) {
      const enhanced = context.enhancedContext as any
      
      // Add formatted context (comprehensive user data)
      if (enhanced.formattedContext) {
        prompt += `${enhanced.formattedContext}\n\n`
      }

      // Add sentiment insights
      if (enhanced.sentiment && enhanced.sentiment.summary) {
        prompt += `=== USER SENTIMENT ===\n`
        prompt += `Overall Sentiment: ${enhanced.sentiment.sentiment} (${enhanced.sentiment.summary})\n`
        prompt += `Use this to tailor your tone and approach.\n\n`
      }

      // Add behavioral insights
      if (enhanced.insights) {
        const insights = enhanced.insights as any
        prompt += `=== BEHAVIORAL INSIGHTS ===\n`
        if (insights.summary) {
          prompt += `${insights.summary}\n\n`
        }
        if (insights.preferences && insights.preferences.length > 0) {
          prompt += `User Preferences: ${insights.preferences.join(', ')}\n`
        }
        if (insights.engagement) {
          prompt += `Engagement Level: ${insights.engagement.level} - ${insights.engagement.description}\n`
        }
        if (insights.recommendations && insights.recommendations.length > 0) {
          prompt += `Recommended Approach: ${insights.recommendations.join(', ')}\n`
        }
        if (insights.personality?.traits && insights.personality.traits.length > 0) {
          prompt += `Personality Traits: ${insights.personality.traits.join(', ')}\n`
        }
        prompt += `Use these insights to personalize your responses.\n\n`
      }
    } else if (context?.profile) {
      // Fallback to basic profile if enhanced context not available
      prompt += `User context:\n${JSON.stringify(context.profile, null, 2)}\n\n`
    }

    return prompt
  }

  private buildRichSystemPrompt(
    config: AIPromptConfig,
    context?: Record<string, unknown>
  ): string {
    let prompt = this.buildSystemPrompt(config, context)
    
    if (config.uiPrompts) {
      prompt += '\nUI Enhancement Guidelines:\n'
      Object.entries(config.uiPrompts).forEach(([key, value]) => {
        prompt += `${key}: ${value}\n`
      })
    }

    prompt += '\nWhen appropriate, include interactive UI components like buttons, cards, and lists to make responses more engaging and actionable.'

    return prompt
  }

  private validateRichResponse(parsed: any): RichAgentResponse {
    // Validate and sanitize the response
    return {
      text: parsed.text || '',
      components: Array.isArray(parsed.components) 
        ? parsed.components.filter((c: any) => c && c.type && c.props)
        : [],
      segues: Array.isArray(parsed.segues)
        ? parsed.segues.filter((s: any) => s && s.type === 'segue' && s.props)
        : [],
      metadata: parsed.metadata || {}
    }
  }

  private getPlaceholderResponse(
    messages: AIMessage[],
    config: AIPromptConfig
  ): string {
    // Placeholder when no API key
    return "I'm here to help! Please configure OPENAI_API_KEY to enable AI responses."
  }

  private getPlaceholderRichResponse(
    messages: AIMessage[],
    config: AIPromptConfig
  ): RichAgentResponse {
    return {
      text: this.getPlaceholderResponse(messages, config),
      components: [],
      segues: []
    }
  }

  setModel(model: string): void {
    this.model = model
  }
}

export const aiService = new AIService()

