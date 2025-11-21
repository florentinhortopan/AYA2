import OpenAI from 'openai'
import { RichAgentResponse, AnyUIComponent } from '@/types/ui'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

interface AIPromptConfig {
  systemPrompt: string
  guidelines?: Record<string, unknown>
  uiPrompts?: Record<string, string>
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
      "type": "button",
      "props": {
        "label": "Button text",
        "action": "action_identifier",
        "variant": "default"
      }
    },
    {
      "type": "card",
      "props": {
        "title": "Card title",
        "description": "Card description",
        "content": "Card content"
      }
    }
  ],
  "metadata": {
    "type": "response_type",
    "suggestedActions": ["action1", "action2"]
  }
}

Available component types: text, button, card, list, badge, alert, accordion
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
        components: []
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

    if (config.guidelines) {
      prompt += 'Guidelines:\n' + JSON.stringify(config.guidelines, null, 2) + '\n\n'
    }

    if (context?.profile) {
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
      components: []
    }
  }

  setModel(model: string): void {
    this.model = model
  }
}

export const aiService = new AIService()

