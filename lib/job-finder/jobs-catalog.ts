export type JobFinderGroup =
  | 'career-paths'
  | 'college-medical'
  | 'specialized-paths'
  | 'career-development'

export interface JobFinderPageDefinition {
  slug: string
  title: string
  group: JobFinderGroup
  shortDescription: string
  sourceUrl: string
  highlights: string[]
}

export const jobFinderPageDefinitions: JobFinderPageDefinition[] = [
  {
    slug: 'find-your-path',
    title: 'Find Your Path',
    group: 'career-paths',
    shortDescription: 'Start with broad role families and narrow by fit.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Career exploration', 'Role categories', 'Fit-based discovery']
  },
  {
    slug: 'enlisted-soldiers',
    title: 'Enlisted Soldiers',
    group: 'career-paths',
    shortDescription: 'Understand enlisted pathways and day-to-day responsibilities.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Hands-on roles', 'Initial training', 'Progression opportunities']
  },
  {
    slug: 'army-officers',
    title: 'Army Officers',
    group: 'career-paths',
    shortDescription: 'Explore officer leadership tracks and requirements.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Leadership focus', 'Commissioning routes', 'Long-term growth']
  },
  {
    slug: 'officer-candidate-school',
    title: 'Officer Candidate School',
    group: 'career-paths',
    shortDescription: 'Pathway details for becoming an officer through OCS.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Eligibility', 'Selection process', 'Training milestones']
  },
  {
    slug: 'warrant-officers',
    title: 'Warrant Officers',
    group: 'career-paths',
    shortDescription: 'Technical leadership path for specialized expertise.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Technical mastery', 'Leadership role', 'Specialized tracks']
  },
  {
    slug: 'army-civilian-careers',
    title: 'Army Civilian Careers',
    group: 'career-paths',
    shortDescription: 'Civilian opportunities supporting Army missions.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Civilian pathways', 'Mission support', 'Professional growth']
  },
  {
    slug: 'college-path',
    title: 'College Path',
    group: 'college-medical',
    shortDescription: 'Combine education and service planning.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['College planning', 'Service pathways', 'Education alignment']
  },
  {
    slug: 'army-rotc',
    title: 'Army ROTC',
    group: 'college-medical',
    shortDescription: 'Leadership development in college via ROTC.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Campus programs', 'Leadership training', 'Commissioning path']
  },
  {
    slug: 'rotc-scholarships',
    title: 'ROTC Scholarships',
    group: 'college-medical',
    shortDescription: 'Funding options and scholarship pathways for ROTC.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Scholarship options', 'Eligibility criteria', 'Application steps']
  },
  {
    slug: 'usma-at-west-point',
    title: 'USMA at West Point',
    group: 'college-medical',
    shortDescription: 'Service academy route and leadership preparation.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Academy experience', 'Admissions overview', 'Officer outcomes']
  },
  {
    slug: 'green-to-gold',
    title: 'Green to Gold',
    group: 'college-medical',
    shortDescription: 'Transition from enlisted service to officer commissioning.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Program routes', 'Eligibility', 'Commissioning timeline']
  },
  {
    slug: 'medical-path',
    title: 'Medical Path',
    group: 'college-medical',
    shortDescription: 'Overview of medical role families and progression.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Medical tracks', 'Training options', 'Career outcomes']
  },
  {
    slug: 'army-medical',
    title: 'Army Medical',
    group: 'college-medical',
    shortDescription: 'Clinical and operational medical roles in the Army.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Clinical roles', 'Operational medicine', 'Team environments']
  },
  {
    slug: 'medical-scholarships',
    title: 'Medical Scholarships',
    group: 'college-medical',
    shortDescription: 'Scholarship options supporting medical training paths.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Funding programs', 'Service commitments', 'Eligibility']
  },
  {
    slug: 'medical-training',
    title: 'Medical Training',
    group: 'college-medical',
    shortDescription: 'Training milestones and readiness expectations.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Training phases', 'Readiness standards', 'Continuing education']
  },
  {
    slug: 'specialized-paths',
    title: 'Specialized Paths',
    group: 'specialized-paths',
    shortDescription: 'High-focus career areas requiring advanced skills.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Specialized roles', 'Unique requirements', 'Advanced preparation']
  },
  {
    slug: 'specialty-jobs',
    title: 'Specialty Jobs',
    group: 'specialized-paths',
    shortDescription: 'Explore specific specialty roles and fit factors.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Role catalog', 'Skill alignment', 'Career planning']
  },
  {
    slug: 'army-law',
    title: 'Army Law',
    group: 'specialized-paths',
    shortDescription: 'Legal pathways and mission-support legal practice.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Legal roles', 'Professional qualifications', 'Career pathways']
  },
  {
    slug: 'army-chaplain',
    title: 'Army Chaplain',
    group: 'specialized-paths',
    shortDescription: 'Faith leadership and support roles.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Spiritual support', 'Community care', 'Leadership service']
  },
  {
    slug: 'army-cyber-technology',
    title: 'Army Cyber & Technology',
    group: 'specialized-paths',
    shortDescription: 'Cybersecurity and technology-focused career options.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Cyber operations', 'Technical training', 'High-demand skills']
  },
  {
    slug: 'army-aviation',
    title: 'Army Aviation',
    group: 'specialized-paths',
    shortDescription: 'Aviation pathways from maintenance to flight operations.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Aviation roles', 'Flight training', 'Mission operations']
  },
  {
    slug: 'army-bands',
    title: 'Army Bands',
    group: 'specialized-paths',
    shortDescription: 'Music performance and public engagement pathways.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Performance roles', 'Audition expectations', 'Professional growth']
  },
  {
    slug: 'special-operations',
    title: 'Special Operations',
    group: 'specialized-paths',
    shortDescription: 'Overview of special operations opportunities and readiness.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['High readiness', 'Selection standards', 'Mission intensity']
  },
  {
    slug: 'army-rangers',
    title: 'Army Rangers',
    group: 'specialized-paths',
    shortDescription: 'Ranger pathway overview and training expectations.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Selection process', 'Physical standards', 'Leadership under pressure']
  },
  {
    slug: 'special-forces',
    title: 'Special Forces',
    group: 'specialized-paths',
    shortDescription: 'Special Forces preparation and role fit.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Assessment', 'Specialized skills', 'Mission focus']
  },
  {
    slug: 'psychological-operations',
    title: 'Psychological Operations',
    group: 'specialized-paths',
    shortDescription: 'Information influence and communication-focused operations.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Information strategy', 'Communication expertise', 'Operational impact']
  },
  {
    slug: 'civil-affairs',
    title: 'Civil Affairs',
    group: 'specialized-paths',
    shortDescription: 'Civil-military coordination and engagement roles.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Community engagement', 'Operational coordination', 'Advisory skills']
  },
  {
    slug: 'army-career-match',
    title: 'Army Career Match',
    group: 'career-development',
    shortDescription: 'Assessment-driven discovery tool for role matching.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Career quiz', 'Role suggestions', 'Next-step guidance']
  },
  {
    slug: 'job-training',
    title: 'Job Training',
    group: 'career-development',
    shortDescription: 'How training maps to military and civilian skills.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Skill development', 'Training pathways', 'Career readiness']
  },
  {
    slug: 'advanced-individual-training',
    title: 'Advanced Individual Training',
    group: 'career-development',
    shortDescription: 'Role-specific technical training after initial entry.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Technical instruction', 'Role readiness', 'Progress milestones']
  },
  {
    slug: 'leadership-training',
    title: 'Leadership Training',
    group: 'career-development',
    shortDescription: 'Leadership progression throughout a career path.',
    sourceUrl: 'https://www.goarmy.com/careers-and-jobs',
    highlights: ['Leadership skills', 'Growth opportunities', 'Career progression']
  }
]

export const jobFinderGroups: Array<{ key: JobFinderGroup; label: string; description: string }> = [
  {
    key: 'career-paths',
    label: 'Career Paths',
    description: 'Choose between enlisted, officer, and civilian route structures.'
  },
  {
    key: 'college-medical',
    label: 'College and Medical',
    description: 'Education-driven and healthcare-oriented paths with scholarship options.'
  },
  {
    key: 'specialized-paths',
    label: 'Specialized Paths',
    description: 'Advanced role families like cyber, aviation, law, and special operations.'
  },
  {
    key: 'career-development',
    label: 'Career Development',
    description: 'Assessment, training progression, and leadership growth milestones.'
  }
]

export function getJobFinderPagesByGroup(group: JobFinderGroup): JobFinderPageDefinition[] {
  return jobFinderPageDefinitions.filter((item) => item.group === group)
}

export function getJobFinderPageBySlug(slug: string): JobFinderPageDefinition | undefined {
  return jobFinderPageDefinitions.find((item) => item.slug === slug)
}
