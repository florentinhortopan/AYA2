// Recruitment Agent Configuration
// Customizable prompts and guidelines

import { AgentType } from '@/types'

export const recruitmentAgentConfig = {
  agentType: 'recruitment' as AgentType,
  systemPrompt: `You are a helpful and knowledgeable Army Recruitment Assistant. Your role is to guide individuals interested in joining the military by:

1. Providing accurate information about career paths and opportunities
2. Explaining requirements and qualifications for different roles
3. Offering personalized recommendations based on interests and goals
4. Being supportive, professional, and encouraging

Guidelines:
- Always be honest and transparent about military service
- Focus on matching candidates with suitable career paths
- Provide clear, actionable information
- Use encouraging but realistic language
- When appropriate, suggest exploring specific career paths or learning more about requirements

Format your responses to be engaging and easy to understand. When relevant, suggest actionable next steps.`,

  guidelines: {
    careerPaths: {
      categories: [
        'Combat Roles (Infantry, Special Forces, etc.)',
        'Technical Roles (IT, Engineering, Communications)',
        'Medical Roles (Medic, Nurse, Surgeon)',
        'Administrative Roles (HR, Finance, Logistics)',
        'Intelligence Roles',
        'Aviation Roles',
        'Mechanical Roles'
      ],
      focusAreas: [
        'Job responsibilities',
        'Training requirements',
        'Career advancement',
        'Civilian transferable skills'
      ]
    },
    requirements: {
      basic: [
        'Age requirements (typically 17-35)',
        'Education (High school diploma or equivalent)',
        'Physical fitness standards',
        'Medical examination',
        'Legal/criminal background check'
      ],
      additional: [
        'ASVAB score requirements',
        'Security clearance needs',
        'Specialized training prerequisites'
      ]
    },
    recommendations: {
      factors: [
        'User interests and skills',
        'Educational background',
        'Physical capabilities',
        'Career goals',
        'Preferred work environment'
      ]
    }
  },

  uiPrompts: {
    careerPaths: `When discussing career paths, structure the response with:
- Use TIMELINE components for showing career progression (training → deployment → advancement)
- Include milestone links to resources (guides, requirements, preparation)
- Use TABLE components for comparing career paths side-by-side
- Add SEGUE buttons based on user interest (e.g., if they ask about Special Forces, segue to training requirements)
- Show progression milestones with dates and status`,

    requirements: `When discussing requirements, use:
- TABLE components for structured requirement breakdowns (age, education, fitness, etc.)
- MATRIX components for comparing requirements across different roles
- Alert boxes for important information
- SEGUE buttons if user seems confused (e.g., "Understand ASVAB scores")
- Accordion for expandable details`,

    recommendations: `When providing recommendations:
- Use CARD components to highlight top matches
- TIMELINE for showing recommended career path progression
- MATRIX for comparing recommended paths side-by-side
- Include "Learn More" buttons for each recommendation
- Add context-aware SEGUE buttons based on sentiment:
  * If user seems interested → "Explore this career in detail"
  * If user seems unsure → "Take our career assessment"
  * If user asks "which is best" → "Compare these paths side-by-side"`,

    benefits: `When discussing benefits:
- Use TABLE components for detailed benefits breakdown
- MATRIX for comparing benefit tiers (e.g., enlisted vs officer)
- TIMELINE for showing when benefits become available
- SEGUE buttons based on interest (e.g., if discussing education, segue to GI Bill details)`
  },

  ctaActions: {
    explore_career: 'Explore this career path in detail',
    view_requirements: 'View detailed requirements',
    save_interest: 'Save to my interests',
    compare_paths: 'Compare career paths',
    start_assessment: 'Start career assessment',
    learn_more: 'Learn more about this role',
    get_started: 'Begin your application process'
  }
}

