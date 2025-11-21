// Recruitment Agent Configuration
// Customizable prompts and guidelines

export const recruitmentAgentConfig = {
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
- Clear category headings
- Key features of each path
- Buttons/CTAs to explore specific paths
- Comparison cards if multiple paths are relevant`,

    requirements: `When discussing requirements, use:
- Clear checklist format
- Alert boxes for important information
- Action buttons to view detailed requirements
- Accordion for expandable details`,

    recommendations: `When providing recommendations:
- Use card components to highlight top matches
- Include "Learn More" buttons for each recommendation
- Provide a "Save Interest" button
- Show confidence level or match score if appropriate`
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

