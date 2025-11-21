import { BaseAgent, AgentMessage } from './base'
import { RichAgentResponse } from '@/types'

export class EducationalAgent extends BaseAgent {
  constructor(context = {}) {
    super('educational', context)
  }

  getInitialMessage(): string {
    return "Hello! I'm your educational assistant. I can help you understand educational opportunities in the military, guide you through training programs, assist with skill development, and provide resources for continuing education. What would you like to learn about?"
  }

  async processMessageRich(
    message: string,
    history: AgentMessage[]
  ): Promise<RichAgentResponse> {
    // For now, use legacy method until we implement AI integration
    const legacyResult = await this.processMessage(message, history)
    return {
      text: legacyResult.response,
      components: [],
      metadata: legacyResult.metadata
    }
  }

  async processMessage(
    message: string,
    history: AgentMessage[]
  ): Promise<{ response: string; metadata?: Record<string, unknown> }> {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('gi bill') || lowerMessage.includes('education') || lowerMessage.includes('degree')) {
      return {
        response: this.getEducationBenefitsResponse(),
        metadata: { type: 'education_benefits' }
      }
    }

    if (lowerMessage.includes('training') || lowerMessage.includes('skill') || lowerMessage.includes('certification')) {
      return {
        response: this.getTrainingResponse(),
        metadata: { type: 'training' }
      }
    }

    if (lowerMessage.includes('career') || lowerMessage.includes('development')) {
      return {
        response: this.getCareerDevelopmentResponse(),
        metadata: { type: 'career_development' }
      }
    }

    if (lowerMessage.includes('resource') || lowerMessage.includes('material') || lowerMessage.includes('study')) {
      return {
        response: this.getResourcesResponse(),
        metadata: { type: 'resources' }
      }
    }

    return {
      response: "I can help you with educational benefits (like the GI Bill), training programs, skill certifications, career development resources, and study materials. What educational topic interests you?",
      metadata: { type: 'general' }
    }
  }

  private getEducationBenefitsResponse(): string {
    return `The military offers excellent educational opportunities:
    
    **GI Bill:**
    - Post-9/11 GI Bill: Covers tuition, housing, and books
    - Montgomery GI Bill: Monthly education payments
    - Transferable to family members (after 6 years of service)
    
    **Tuition Assistance:**
    - Up to $4,500/year while serving
    - Can be used for college courses, certifications
    - Available during active duty
    
    **Additional Programs:**
    - SkillBridge (transition training)
    - CLEP/DSST exams (free college credits)
    - Military-specific training and certifications
    
    Are you interested in pursuing a degree, certification, or specific skill training?`
  }

  private getTrainingResponse(): string {
    return `Military training covers a wide range:
    
    **Job-Specific Training:**
    - Technical skills (IT, mechanics, medical, etc.)
    - Leadership development programs
    - Specialized certifications
    
    **Continuing Education:**
    - Online courses and programs
    - Professional development workshops
    - Advanced training courses
    
    **Certifications Available:**
    - Technical certifications (CompTIA, Cisco, etc.)
    - Professional licenses (CDL, EMT, etc.)
    - Military-specific credentials
    
    What type of training or certification interests you?`
  }

  private getCareerDevelopmentResponse(): string {
    return `Career development in the military includes:
    
    **On-the-Job Learning:**
    - Hands-on experience in your field
    - Mentorship opportunities
    - Cross-training in related areas
    
    **Advancement Paths:**
    - Promotions based on performance and qualifications
    - Specialized career tracks
    - Leadership positions
    
    **Transition Planning:**
    - Skill translation to civilian careers
    - Networking opportunities
    - Resume building and interview prep
    
    What career development goals do you have?`
  }

  private getResourcesResponse(): string {
    return `Here are valuable educational resources:
    
    **Free Resources:**
    - Khan Academy, Coursera (some free courses)
    - Military libraries and learning centers
    - Online training platforms
    
    **Study Materials:**
    - Test prep for CLEP/DSST exams
    - Field manuals and technical guides
    - Professional development books
    
    **Support:**
    - Educational counselors
    - Study groups and tutoring
    - Learning management systems
    
    What subject or skill would you like to study? I can recommend specific resources.`
  }
}

