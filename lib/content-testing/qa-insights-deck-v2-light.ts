import {
  type QaEvidenceItem,
  type QaInsightTheme,
  type QaInsightsSlide,
  type QaRiskItem,
  type QaRoadmapColumn,
} from './qa-insights-deck'

const theme1: QaInsightTheme = {
  label: 'Theme 01',
  title: 'Relevance is the experience',
  finding:
    'Relevance gaps are visible in the issue tags: 7 completeness tags, 4 clarity tags, and 2 content-gap tags appeared across 41 prompt evaluations.',
  implication:
    'A topical answer still fails when it does not satisfy the specific intent, especially numeric pay, benefits, career exploration, and parent/influencer framing.',
  recommendation:
    'Prioritize answer templates and intent classes for the highest-friction prompts before adding more content volume.',
}

const theme2: QaInsightTheme = {
  label: 'Theme 02',
  title: 'Real voices must feel truly human',
  finding:
    'Soldier voices were present in 17 of 41 responses, but quote quality was the largest issue type with 9 tagged gaps, plus 2 authenticity gaps.',
  implication:
    'Human proof can backfire when quotes are repeated, mismatched, over-polished, or missing MOS/job and service context.',
  recommendation:
    'Add quote relevance thresholds, attribution metadata, repeated-quote suppression, and a no-quote fallback when no relevant voice exists.',
}

const theme3: QaInsightTheme = {
  label: 'Theme 03',
  title: 'The bot should guide the journey',
  finding:
    'Segue pills were present in the experience, but only 4 of 41 responses were tagged as clear action routes: source path, recruiter/live-chat handoff, or useful next-step CTA.',
  implication:
    'Follow-up prompts can keep the conversation going, but they are not a substitute for routing users to the next useful GoArmy page, recruiter path, or human handoff.',
  recommendation:
    'Keep segue pills, but distinguish them from intent-based routes to source links, Career Match, All Jobs, recruiters, live chat, or clarifying flows.',
}

const theme4: QaInsightTheme = {
  label: 'Theme 04',
  title: 'Trust requires proof',
  finding:
    'Trust is where feature evolution shows up: 13 of 42 issue tags were High or Critical, including pay, service commitment, influencer intent, and sensitive safety handling.',
  implication:
    'Users will leave to Google or a human when high-stakes answers do not provide a direct baseline, official source, or clear limitation.',
  recommendation:
    'Lead with answer-first formatting, cite official sources, state limits, and escalate sensitive or high-stakes moments to approved human/support paths.',
}

const themeMetrics = {
  relevance: [
    { label: 'Completeness gaps', value: '7', note: 'Issue tags where the answer missed key facts, numbers, or detail.' },
    { label: 'Clarity gaps', value: '4', note: 'Issue tags where answer hierarchy or wording reduced usefulness.' },
    { label: 'Content gaps', value: '2', note: 'Issue tags where GoArmy content coverage or retrieval needed improvement.' },
  ],
  voices: [
    { label: 'Quotes used', value: '17', note: 'Of 41 responses, these included a Soldier quote.' },
    { label: 'Quote-quality gaps', value: '9', note: 'Largest issue type in the structured QA tags.' },
    { label: 'Authenticity gaps', value: '2', note: 'Tags for responses that felt too polished, repeated, or bot-like.' },
  ],
  journey: [
    { label: 'Action routes', value: '4', note: 'Of 41 responses, these had a clear source path, CTA, or human handoff. This does not count generic segue pills.' },
    { label: 'Routing gaps', value: '7', note: 'Issue tags for missing, unclear, or weak source paths, CTAs, routing, or handoff.' },
    { label: 'Prompts analyzed', value: '41', note: 'Total prompt evaluations in the June QA round.' },
  ],
  trust: [
    { label: 'High / critical tags', value: '13', note: 'Of 42 issue tags, these were rated High or Critical.' },
    { label: 'Trust tags', value: '4', note: 'Issue tags directly tied to source confidence, assumptions, or audience trust.' },
    { label: 'Accuracy tags', value: '2', note: 'Issue tags where factual assumptions needed SME/source validation.' },
  ],
}

const roadmap: QaRoadmapColumn[] = [
  {
    label: 'Now',
    title: 'Fix high-risk answers',
    items: [
      'Pay, service commitment, Basic Training, and sensitive-topic templates.',
      'Answer-first structure with official source paths.',
      'Clear caveats when a number or policy varies.',
    ],
  },
  {
    label: 'Next',
    title: 'Improve orchestration',
    items: [
      'Intent classes for pay, parents, careers, safety, and Basic Training anxiety.',
      'Quote relevance thresholds and suppression rules.',
      'Contextual CTAs and recruiter/live-chat handoff logic.',
    ],
  },
  {
    label: 'Validate',
    title: 'Run round 2',
    items: [
      'Retest 8-10 high-risk prompts after template changes.',
      'Measure directness, source confidence, quote relevance, and CTA usefulness.',
      'Turn findings into Jira-ready acceptance criteria.',
    ],
  },
]

const contentGapRisks: QaRiskItem[] = [
  {
    area: 'Pay',
    severity: 'Critical',
    issue: 'Users asked for first-year pay, annual pay, and direct numbers; the bot often gave generalized compensation explanations.',
    recommendation: 'Give a number or range immediately, label base salary vs. total compensation, and link to Money & Pay.',
  },
  {
    area: 'Service commitment',
    severity: 'Critical',
    issue: 'Answers over-indexed on 20-year retirement instead of minimum or typical first contract length.',
    recommendation: 'Distinguish initial contract, total obligation, and career/retirement path.',
  },
  {
    area: 'Sources / citations',
    severity: 'Critical',
    issue: 'Users asked for citations, links, verification, and related GoArmy pages, but answers appeared closed-context.',
    recommendation: 'Add a Sources / Learn more module for high-stakes topics.',
  },
  {
    area: 'Sensitive safety',
    severity: 'Critical',
    issue: 'Generic reassurance was insufficient for safety and sexual assault questions and risked damaging trust.',
    recommendation: 'Create a sensitive-topic framework with seriousness, approved resources, and human handoff.',
  },
  {
    area: 'Basic Training',
    severity: 'High',
    issue: 'The site has 10 weeks, phases, schedule, and reassurance; the bot sometimes led with high-level or quote-led answers.',
    recommendation: 'Use a structured pattern: direct answer, what happens, daily life, reassurance, and source CTA.',
  },
  {
    area: 'Parent / influencer',
    severity: 'High',
    issue: 'Parent questions were sometimes interpreted literally as childcare questions instead of safety/support/care intent.',
    recommendation: 'Create a parent/influencer intent classifier and parent-focused answer pattern.',
  },
  {
    area: 'Career routing',
    severity: 'High',
    issue: 'Users wanted job area links, MOS definitions, and examples; the bot answered generally instead of acting as a navigation hub.',
    recommendation: 'Route to All Jobs, Career Match, job families, and training pages.',
  },
  {
    area: 'Quote relevance',
    severity: 'High',
    issue: 'Repeated, loosely relevant, overly polished, acronym-heavy, or emotionally mismatched quotes undermined trust.',
    recommendation: 'Add quote relevance thresholds, suppress repetition, match emotional intent, and add quote metadata.',
  },
]

const evidence = {
  relevance: [
    {
      participant: 'Grace',
      title: 'Numeric intent needs a numeric answer',
      quote: 'Q: How much will I make my first year as a Soldier? Give me a number.',
      context: 'A: Pay depends on rank, years of service, full/part-time status, bonuses, allowances, and benefits.',
    },
    {
      participant: 'Arjun',
      title: 'Relevant content can be weakened by irrelevant quotes',
      quote: 'Q: What benefits do I get as an infantryman?',
      context:
        'A: Enlisted Soldiers have access to pay, health care, education support, bonuses, housing support, retirement options, and family resources; eligibility varies.',
    },
    {
      participant: 'Paul',
      title: 'Career exploration needs a clear path forward',
      quote: 'Q: Does the Army have both technical and hands-on careers?',
      context:
        'A: Lists career fields including Science & Medicine, Support & Logistics, Signal & Intelligence, Aviation & Aerial Defense, Mechanics & Engineering, and Ground Forces.',
    },
  ],
  voices: [
    {
      participant: 'Shawn',
      title: 'Quote authors need context to feel human',
      quote: 'Q: Is the Army fun?',
      context:
        'A: Answer discusses life outside Army/work, community, adventure, and becoming a good member of society.',
    },
    {
      participant: 'Grace',
      title: 'Identity-specific prompts need identity-specific voices',
      quote: "Q: What's it like to be a woman in the Army?",
      context:
        'A: General answer about women in Army life, opportunities, standards, work, training, and family support.',
    },
    {
      participant: 'Rachel',
      title: 'Some answers need human storytelling',
      quote: 'Q: Will I make any friends?',
      context:
        'A: Maintain friendships while serving and build new ones through routines, teamwork, and Army community.',
    },
  ],
  journey: [
    {
      participant: 'Morgan',
      title: 'Validation needs concrete next steps',
      quote: 'Q: What if I do not fit in at Basic Training?',
      context: 'A: Validated feelings but did not provide enough concrete help.',
    },
    {
      participant: 'Paul',
      title: 'Broad answers need source paths',
      quote: 'Q: What does a career in the Army look like?',
      context:
        'A: Army can be a strong career if it fits goals; offers training, pay, health care, education benefits, family support, housing, and 200+ jobs.',
    },
    {
      participant: 'Grace',
      title: 'Supportive answers create room for next steps',
      quote: 'Q: Is Basic Training hard?',
      context: 'A: Basic Training is demanding by design; Drill Sergeants build recruits up; about 90% complete training.',
    },
  ],
  trust: [
    {
      participant: 'Shawn',
      title: 'Unsupported assumptions break trust fast',
      quote: 'Q: How much do I get paid a year?',
      context:
        'A: Says junior Officer basic pay starts strong and grows with rank/service time; compensation includes benefits.',
    },
    {
      participant: 'Rachel',
      title: 'Commitment answers need the baseline first',
      quote: 'Q: How many years do I need to stay in the Army?',
      context:
        'A: You can serve 20 years if meeting standards; may lead to pension; path can include Active Duty, Reserve, or Guard.',
    },
    {
      participant: 'Morgan',
      title: 'Sensitive topics need transparent handling',
      quote: 'Q: Have sexual assault rates decreased over time?',
      context:
        'A: Response was perceived as evasive because it did not provide transparent trend data, source links, or a clear handoff.',
    },
  ],
} satisfies Record<string, QaEvidenceItem[]>

const deepDiveSlides: QaInsightsSlide[] = [
  {
    id: 'deep-dive-validation-soldier-voices',
    section: 'Appendix',
    kind: 'finding',
    visual: 'deepDiveMatrix',
    eyebrow: 'Validation deep dive 01',
    title: 'Soldier voices validate the core experience',
    subtitle: 'Real voices create trust when they feel specific, human, and grounded in the question.',
    deepDive: {
      type: 'Validation',
      goal: 'Prove the real-Soldier perspective concept works for MVP; the work is preserving credibility through quote fit and context.',
      examples: [
        {
          label: 'Grace',
          prompt: 'Is the Army fun?',
          answer: 'Army life is not all work; downtime, hobbies, family, friends, adventure, and community can vary by job, mission, training, and unit.',
          evidence: 'Positive. Grace expected "fun, but..." and felt the response balanced that well. Quotes felt sincere and real.',
          takeaway: 'Validates the emotional/authenticity layer of the MVP experience.',
          screenshots: 'images 002-004',
        },
        {
          label: 'Rachel',
          prompt: 'Will I make any friends?',
          answer: 'You can maintain friendships while serving and build new ones through shared routines, teamwork, and the Army community.',
          evidence: 'Rank/name made quotes feel real and unexpectedly delightful; spoken tone felt believable.',
          takeaway: 'Names, rank, and human tone make the feature credible before richer media is added.',
          screenshots: 'images 045-047',
        },
        {
          label: 'Shawn',
          prompt: 'Is the Army fun?',
          answer: 'The answer paired a general Army-life summary with Soldier quotes about community, adventure, and life outside work.',
          evidence: 'Mixed. The quotes felt impersonal because rank/acronym plus first name/last initial did not tell him who the person really was.',
          takeaway: 'Soldier voices work best when quote metadata proves the person is real and relevant.',
          screenshots: 'images 033-035',
        },
      ],
      screenshots: ['Primary: Grace images 002-004', 'Alternate: Rachel images 045-047', 'Caveat: Shawn images 033-035 for quote-metadata need'],
      issueRecall: [
        'Positive validation: "Quotes felt sincere and real" (Grace).',
        'GRA-003: repeated quotes reduce tailoring.',
        'SHA-002 / RAC-007: quote metadata such as MOS, age, years served, photo, or video would increase trust.',
      ],
      presenterNotes: [
        'The Soldier voice layer is MVP-valid.',
        'Post-launch work is guardrails: avoid repetition, add metadata, explain acronyms, and suppress weak quote matches.',
      ],
    },
  },
  {
    id: 'deep-dive-validation-baseline-answers',
    section: 'Appendix',
    kind: 'finding',
    visual: 'deepDiveMatrix',
    eyebrow: 'Validation deep dive 02',
    title: 'Baseline answers are useful when facts surface clearly',
    subtitle: 'Common prospect questions can be answered well when the bot retrieves and structures the right content.',
    deepDive: {
      type: 'Validation',
      goal: 'Show that users often got a useful enough answer to continue, supporting the MVP-ready argument.',
      examples: [
        {
          label: 'Grace',
          prompt: 'Is Basic Training hard?',
          answer: 'Basic Training is demanding by design; Drill Sergeants build recruits up; about 90% of recruits complete training.',
          evidence: 'Positive. The 90% completion statistic reassured Grace and felt useful.',
          takeaway: 'Common prospect anxiety can be answered in a reassuring, useful way.',
          screenshots: 'images 010-011',
        },
        {
          label: 'Arjun',
          prompt: 'How much free time would I have in Basic Training?',
          answer: 'Basic Training runs roughly from early morning to evening, with limited personal time and restricted phone/device access.',
          evidence: 'Mostly answers because it gives timeframe, device context, and a structured-day baseline.',
          takeaway: 'Useful detail works, but quote fit still matters because one personal-luxury quote could increase anxiety.',
          screenshots: 'images 019-020',
        },
        {
          label: 'Morgan',
          prompt: 'How long is Basic Training?',
          answer: 'Basic Combat Training is 10 weeks, followed by a summary of structure, phases, and expectations.',
          evidence: 'Mostly useful, but she expected the exact number first and the explanation after it.',
          takeaway: 'Facts-first ordering is as important as factual coverage.',
          screenshots: 'No screenshot available',
        },
      ],
      screenshots: ['Primary: Grace images 010-011', 'Alternate: Arjun images 019-020', 'No screenshot: Morgan Basic Training length example'],
      issueRecall: [
        'Ready/Mostly Ready examples exist across Basic Training, daily life, and brand-safety moments.',
        'Caveat: Basic Training still needs consistent answer-first structure and sourcing.',
        'ARJ-003: one Basic Training quote may increase anxiety or miss free-time intent.',
      ],
      presenterNotes: [
        'This is why the verdict is not "the system fails."',
        'It answers many expected questions, but needs better consistency and structure.',
      ],
    },
  },
  {
    id: 'deep-dive-validation-boundaries-handoff',
    section: 'Appendix',
    kind: 'finding',
    visual: 'deepDiveMatrix',
    eyebrow: 'Validation deep dive 03',
    title: 'Boundaries and handoff prevent dead ends',
    subtitle: 'Refusals and action modules give the MVP a safer, more navigable baseline.',
    deepDive: {
      type: 'Validation',
      goal: 'Show that the bot can protect the experience through off-topic/misuse refusal and, when present, contact or recruiter pathways.',
      examples: [
        {
          label: 'Grace',
          prompt: 'What does success look like for women in the Army?',
          answer: 'A yellow CTA appeared: "Let’s take this conversation further" with Live Chat, Contact a Recruiter, and Call Us.',
          evidence: 'Yellow CTA module appeared with Live Chat, Contact a Recruiter, and Call Us. Grace liked it and felt it was not pushy.',
          takeaway: 'Handoff is valuable when it follows a useful answer.',
          screenshots: 'images 007-009',
        },
        {
          label: 'Rachel / Arjun',
          prompt: 'Who has the best ice cream? / When are aliens coming to Earth?',
          answer: 'The bot refused with out-of-territory language and redirected back to Army-focused questions.',
          evidence: 'Positive. Boundaries made the experience feel Army-specific and reduced abuse risk.',
          takeaway: 'Out-of-scope boundaries are a positive MVP behavior.',
          screenshots: 'Rachel image 052; Arjun image 023',
        },
        {
          label: 'Shawn',
          prompt: 'Can you do my homework?',
          answer: 'The bot produced a confusing refusal instead of plainly saying it cannot do homework and is meant for Army questions.',
          evidence: 'Negative. Shawn expected a direct boundary: "No, I can’t do your homework, but this tool is meant to learn more about the Army."',
          takeaway: 'Refusals need plain-language redirection, not just a generic boundary.',
          screenshots: 'No dedicated screenshot',
        },
      ],
      screenshots: ['Primary: Grace images 007-009', 'Boundary proof: Arjun image 023 or Rachel image 052', 'Caveat: Shawn homework prompt has no dedicated screenshot'],
      issueRecall: [
        'Out-of-scope refusal works across multiple participants.',
        'SHA-006: "Live Chat" label is ambiguous because the user is already chatting.',
        'MOR-003 / SHA-009: handoff should transfer context and explain when the user is moving from bot to human.',
      ],
      presenterNotes: [
        'MVP has the bones of safe boundaries and routing.',
        'Post-launch refinement is clearer labels, context continuity, and more direct refusal language.',
      ],
    },
  },
  {
    id: 'deep-dive-enhancement-factual-baselines',
    section: 'Appendix',
    kind: 'finding',
    visual: 'deepDiveMatrix',
    eyebrow: 'Enhancement deep dive 01',
    title: 'High-intent factual answers need baselines first',
    subtitle: 'Numbers, time, minimums, and policy questions need direct answers before caveats.',
    deepDive: {
      type: 'Enhancement',
      goal: 'Show that the biggest response-quality depth issue is factual specificity: "it depends" is not enough without a concrete baseline.',
      examples: [
        {
          label: 'Grace',
          prompt: 'How much will I make my first year as a Soldier? Give me a number.',
          answer: 'Pay depends on rank, years of service, full-time/part-time status, bonuses, allowances, and benefits.',
          evidence: 'Mixed to negative. The answer gave dependency factors but no number.',
          takeaway: 'Needs a number, range, pay table, calculator, or explicit reason a number cannot be given.',
          screenshots: 'images 012-014',
        },
        {
          label: 'Shawn',
          prompt: 'How much do I get paid a year?',
          answer: 'Junior Officer basic pay starts strong and grows with rank/service time; compensation includes benefits.',
          evidence: 'Strong negative. The answer assumed junior Officer and avoided the requested number; he wanted to Google Army Pay.',
          takeaway: 'This is the clearest accuracy and trust failure.',
          screenshots: 'image 040',
        },
        {
          label: 'Rachel',
          prompt: 'How many years do I need to stay in the Army?',
          answer: 'You can serve 20 years if meeting standards; the path may lead to pension and can include Active Duty, Reserve, or Guard.',
          evidence: 'Not pointed enough. Rachel expected minimum, average, Active/Reserve/Officer framing before retirement.',
          takeaway: 'Commitment answers need hierarchy before 20-year pension framing.',
          screenshots: 'images 049-050',
        },
      ],
      screenshots: ['Primary: Grace images 012-014', 'Strongest risk: Shawn image 040', 'Alternate: Rachel images 049-050'],
      issueRecall: [
        'GRA-004: pay answer gives no number. Severity: High.',
        'SHA-004/SHA-005: pay assumes Officer and does not give a number. Severity: High.',
        'RAC-005/RAC-006: service length needs minimum/typical ranges and should not wrongly focus on OCS/officers. Severity: High.',
      ],
      presenterNotes: [
        'This is not a concept blocker.',
        'It is a content-template and retrieval problem: answer first, source second, caveats third.',
      ],
    },
  },
  {
    id: 'deep-dive-enhancement-intent-detection',
    section: 'Appendix',
    kind: 'finding',
    visual: 'deepDiveMatrix',
    eyebrow: 'Enhancement deep dive 02',
    title: 'Intent detection needs to understand who is asking',
    subtitle: 'The bot is often topically close but misses audience mode or the real job-to-be-done.',
    deepDive: {
      type: 'Enhancement',
      goal: 'Show that smarter orchestration means answering the real user intent, not just matching surface keywords.',
      examples: [
        {
          label: 'Shawn',
          prompt: 'Will my child be taken care of?',
          answer: 'The answer interpreted "child" as a Soldier’s dependent and described childcare/daycare options.',
          evidence: 'Failed parent/influencer intent. The bot answered with childcare options for a Soldier’s dependent child.',
          takeaway: 'Parent questions need safety/support/care framing, not daycare literalism.',
          screenshots: 'image 041',
        },
        {
          label: 'Shawn',
          prompt: 'My child is thinking about the Army. What should I know?',
          answer: 'The answer gave Army life, careers, and benefits framing but spoke to the prospective Soldier instead of the parent.',
          evidence: 'Still fails influencer intent; answer spoke to the child/prospect, not the parent.',
          takeaway: 'Audience mode should be inferred or clarified.',
          screenshots: 'image 042',
        },
        {
          label: 'Rachel',
          prompt: 'Can I choose the same MOS as my friend?',
          answer: 'The answer discussed MOS selection, requirements, and reclassing, then offered recruiter contact.',
          evidence: 'Missed friend/co-location intent. Recruiter CTA was useful because this is a recruiter-level question.',
          takeaway: 'Some questions need routing or handoff when policy depends on scenario.',
          screenshots: 'image 048',
        },
      ],
      screenshots: ['Primary: Shawn images 041-042', 'Secondary: Rachel image 048', 'Move career-routing proof to content/retrieval slide'],
      issueRecall: [
        'SHA-007: parent/influencer prompt maps to daycare. Severity: High.',
        'SHA-008: parent prompt speaks to prospect, not parent. Severity: High.',
        'RAC-004: MOS/friend question misses co-location/friend intent. Severity: High.',
        'PAU-004: career answer needs links to career exploration pages. Severity: Medium.',
      ],
      presenterNotes: [
        'The answers are often topically close.',
        'Intent matching is what turns a chatbot into a decision-support layer.',
      ],
    },
  },
  {
    id: 'deep-dive-enhancement-content-gap',
    section: 'Appendix',
    kind: 'finding',
    visual: 'deepDiveMatrix',
    eyebrow: 'Enhancement deep dive 03',
    title: 'The site has the content. The bot needs to use it.',
    subtitle: 'The next leap is retrieval, citation, answer templates, and routing, not simply writing more content.',
    deepDive: {
      type: 'Enhancement',
      goal: 'Connect the research to the GoArmy.com content gap analysis and bridge into recommendations.',
      examples: [
        {
          label: 'Pay',
          prompt: 'How much do I get paid a year?',
          answer: 'The bot gave compensation context but no concrete number and, in Shawn’s case, assumed junior Officer.',
          evidence: 'GoArmy Money & Pay has concrete examples and salary tables; participants wanted links, citations, or a verification path.',
          takeaway: 'Use source-backed pay templates with range/table links.',
          screenshots: 'Grace images 012-014 or Shawn image 040',
        },
        {
          label: 'Service commitment',
          prompt: 'How many years do I need to stay in the Army?',
          answer: 'The bot led with 20-year retirement/pension framing or officer/OCS framing instead of minimum and typical obligation.',
          evidence: 'GoArmy explains 2-6 year contracts and the 8-year Military Service Obligation.',
          takeaway: 'Lead with minimum/typical obligation, then explain caveats.',
          screenshots: 'Rachel images 049-051 or Paul image 030',
        },
        {
          label: 'Sensitive safety / sources',
          prompt: 'Have sexual assault rates decreased over time?',
          answer: 'The answer gave generic reassurance instead of trend data, a source, or a human-support path.',
          evidence: 'Morgan read this as off-mark and potentially hidden, which could reduce trust in the Army and the site.',
          takeaway: 'High-stakes topics need approved source links, transparent limits, and human handoff.',
          screenshots: 'No screenshot available',
        },
      ],
      screenshots: [
        'Primary combo: Shawn image 040 + Rachel images 049-051',
        'Single screenshot option: Shawn image 040 for pay/source trust failure',
        'No screenshot: Morgan sensitive-safety/source example',
        'Chart option: 8-gap severity chart from content gap analysis: 4 Critical, 4 High',
      ],
      issueRecall: [
        'Critical gaps: pay numbers, service commitment framing, citations/source links, sensitive safety response.',
        'High gaps: Basic Training facts-first structure, parent/influencer intent, career routing, quote relevance.',
        'Paul, Shawn, Morgan, and Arjun independently asked for links, citations, or source paths.',
      ],
      presenterNotes: [
        'The opportunity is not only "write more content."',
        'Make Army Answers behave like a source-backed site concierge: direct answer, official proof, then next best route.',
      ],
    },
  },
]

const interpretationSlides: QaInsightsSlide[] = [
  {
    id: 'interpretation-authenticity-trust-great',
    section: 'Appendix',
    kind: 'finding',
    visual: 'deepDiveMatrix',
    eyebrow: 'Interpretation 01',
    title: 'Authenticity and trust continue to be great',
    subtitle: 'The real-Soldier concept is working; the risk is losing credibility through weak quote context.',
    deepDive: {
      type: 'Validation',
      goal: 'Reframe the transcript evidence into the strongest MVP-positive story: real voices still create trust when they feel specific and human.',
      examples: [
        {
          label: 'Grace',
          prompt: 'Is the Army fun?',
          answer: 'Army life is not all work; the answer balanced downtime, hobbies, family/friends, mission, unit, and Soldier quotes.',
          evidence: 'Grace liked the quotes, said they felt sincere, and assumed they came from real people before being prompted.',
          takeaway: 'The core authenticity mechanism works when quotes sound like something a person actually said.',
          screenshots: 'images 002-004',
        },
        {
          label: 'Rachel',
          prompt: 'Will I make any friends?',
          answer: 'The response paired a direct answer with real Soldier quotes about friendships, routines, teamwork, and community.',
          evidence: 'Rachel said the rank/name made the quotes feel real and the spoken tone felt believable.',
          takeaway: 'Rank/name plus conversational quote tone can produce a positive trust moment.',
          screenshots: 'images 045-047',
        },
        {
          label: 'Shawn',
          prompt: 'Is the Army fun?',
          answer: 'The response used Soldier quotes, but only showed rank/acronym and partial names.',
          evidence: 'Shawn trusted the idea less when the quote authors felt anonymous or avatar-like.',
          takeaway: 'Trust stays strong if quote metadata keeps pace with the promise of real Soldier voices.',
          screenshots: 'images 033-035',
        },
      ],
      screenshots: ['Primary: Grace images 002-004', 'Alternate: Rachel images 045-047', 'Caveat: Shawn images 033-035'],
      issueRecall: [
        'Quotes were repeatedly described as sincere, real, or believable when specific.',
        'Quote repetition and generic attribution are the main authenticity risks.',
        'Metadata needs: MOS/job, age or years served, photo/video, and acronym clarity.',
      ],
      presenterNotes: [
        'This is the strongest validation theme: the concept is not broken.',
        'The work is preserving trust through better quote selection, metadata, and suppression rules.',
      ],
    },
  },
  {
    id: 'interpretation-easy-use-navigate',
    section: 'Appendix',
    kind: 'finding',
    visual: 'deepDiveMatrix',
    eyebrow: 'Interpretation 02',
    title: 'Chatbot is easy to use and navigate',
    subtitle: 'Participants understood the entry points, follow-ups, chat history, and next-step affordances.',
    deepDive: {
      type: 'Validation',
      goal: 'Show that the experience mechanics are intuitive enough for MVP, even when individual labels need refinement.',
      examples: [
        {
          label: 'Grace',
          prompt: 'First reaction to the suggested questions',
          answer: 'The chatbot surfaced four starting prompts and still allowed a custom question in the input.',
          evidence: 'Grace said the prompts gave a stepping stone for someone who has no idea where to start.',
          takeaway: 'Guided entry works without blocking open-ended exploration.',
          screenshots: 'images 001-002',
        },
        {
          label: 'Rachel',
          prompt: 'Can I choose the same MOS as my friend?',
          answer: 'The answer included a recruiter/contact module when the question became scenario-specific.',
          evidence: 'Rachel liked that chat/contact/call appeared immediately and preferred that order.',
          takeaway: 'Navigation from answer to human support feels useful when the bot reaches a natural limit.',
          screenshots: 'image 048',
        },
        {
          label: 'Grace',
          prompt: 'Can I scroll back to the first four questions?',
          answer: 'The experience kept a continuous chat history that could be revisited.',
          evidence: 'Grace called the history behavior cool and compared it to useful memory in ChatGPT.',
          takeaway: 'Conversation continuity is intuitive and can support return visits.',
          screenshots: 'images 007-009',
        },
      ],
      screenshots: ['Primary: Grace images 001-002', 'Secondary: Rachel image 048', 'Handoff example: Grace images 007-009'],
      issueRecall: [
        'Suggested prompts were generally understood as useful starting points.',
        'Follow-up pills worked, but some were redundant or unclear.',
        'Live Chat needs clearer labeling because users may think they are already in live chat.',
      ],
      presenterNotes: [
        'The UI is doing its job: users can start, continue, route, and recover.',
        'The next pass should improve label clarity and reduce redundant follow-up prompts.',
      ],
    },
  },
  {
    id: 'interpretation-coverage-reliability-pretty-good',
    section: 'Appendix',
    kind: 'finding',
    visual: 'deepDiveMatrix',
    eyebrow: 'Interpretation 03',
    title: 'Content coverage and reliability is pretty good',
    subtitle: 'With partial content loaded, participants still often received something usable enough to keep going.',
    deepDive: {
      type: 'Validation',
      goal: 'Separate coverage from depth: the system often has the right topic, but not always the right precision or structure.',
      examples: [
        {
          label: 'Grace',
          prompt: 'Is Basic Training hard?',
          answer: 'Basic Training is demanding by design; Drill Sergeants build recruits up; about 90% complete training.',
          evidence: 'Grace found the 90% statistic reassuring and useful.',
          takeaway: 'For common anxieties, the bot can retrieve a useful baseline.',
          screenshots: 'images 010-011',
        },
        {
          label: 'Arjun',
          prompt: 'What benefits do I get as an infantryman?',
          answer: 'The response listed pay, health care, education, bonuses, housing, retirement, and family resources with eligibility caveats.',
          evidence: 'Arjun said the list of benefit types was good and the caveat about eligibility made sense.',
          takeaway: 'Coverage is solid when the answer gives a structured list and acknowledges variability.',
          screenshots: 'images 021-022',
        },
        {
          label: 'Paul',
          prompt: 'Who is better, Army or Navy?',
          answer: 'The response avoided overclaiming and framed the answer around best fit and how someone wants to serve.',
          evidence: 'Paul liked that it did not simply say Army is best and gave useful service framing.',
          takeaway: 'The bot can handle brand-sensitive questions without sounding overly promotional.',
          screenshots: 'image 032',
        },
      ],
      screenshots: ['Primary: Grace images 010-011', 'Alternate: Arjun images 021-022', 'Brand-safety proof: Paul image 032'],
      issueRecall: [
        'Coverage worked best for Basic Training, benefits categories, friendship/community, and brand-safety prompts.',
        'Reliability drops when the user expects a number, source link, or audience-specific framing.',
        'Quotes should be omitted when no relevant quote exists.',
      ],
      presenterNotes: [
        'The story is not that content coverage fails everywhere.',
        'The right framing is: coverage is pretty good, but precision and structure need a next pass.',
      ],
    },
  },
  {
    id: 'interpretation-response-quality-depth-sucks',
    section: 'Appendix',
    kind: 'finding',
    visual: 'deepDiveMatrix',
    eyebrow: 'Interpretation 04',
    title: 'System response quality and depth sucks',
    subtitle: 'When questions get high-intent, layered, emotional, or numerical, the system gets too shallow.',
    deepDive: {
      type: 'Enhancement',
      goal: 'Translate the harsh business framing into the evidence: the issue is not topicality, it is depth, directness, and answer hierarchy.',
      examples: [
        {
          label: 'Shawn',
          prompt: 'How much do I get paid a year?',
          answer: 'The bot assumed junior Officer, discussed benefits, and avoided a concrete annual pay number.',
          evidence: 'Shawn said the information was wrong, danced around low pay, and made him want to Google Army Pay.',
          takeaway: 'High-intent factual prompts need direct baselines, not generalized compensation framing.',
          screenshots: 'image 040',
        },
        {
          label: 'Rachel',
          prompt: 'How many years do I need to stay in the Army?',
          answer: 'The bot led with 20-year service and pension framing instead of minimum and typical commitment ranges.',
          evidence: 'Rachel expected Active/Reserve/Officer caveats and minimum/average contract framing.',
          takeaway: 'The answer can be topically related and still fail the decision need.',
          screenshots: 'images 049-050',
        },
        {
          label: 'Morgan',
          prompt: 'Have rates of sexual assault decreased over time?',
          answer: 'The bot gave generic reassurance instead of transparent trend data, source links, or an approved support path.',
          evidence: 'Morgan read it as off-mark and potentially hidden, which could reduce trust in the Army.',
          takeaway: 'Sensitive high-stakes topics need a different response model.',
          screenshots: 'No screenshot available',
        },
      ],
      screenshots: ['Primary: Shawn image 040', 'Secondary: Rachel images 049-050', 'No screenshot: Morgan sensitive-safety example'],
      issueRecall: [
        'Pay, commitment, parent intent, and sensitive safety produced the sharpest quality/depth failures.',
        'The repeated pattern is answer adjacency: near the topic, but not deep enough for the actual decision.',
        'Fix pattern: direct answer first, source proof second, caveats third, handoff when needed.',
      ],
      presenterNotes: [
        'This slide should sound blunt because the business title is blunt.',
        'The nuance is that the system often understands topic, but not the depth required to satisfy intent.',
      ],
    },
  },
  {
    id: 'interpretation-supporting-visuals-arent-there',
    section: 'Appendix',
    kind: 'finding',
    visual: 'deepDiveMatrix',
    eyebrow: 'Interpretation 05',
    title: "Supporting visuals during the experience aren't there",
    subtitle: 'Users wanted proof around the people, sources, and context behind the answer.',
    deepDive: {
      type: 'Enhancement',
      goal: 'Make the visual gap specific: this is less about decoration and more about credibility, context, and source-backed proof.',
      examples: [
        {
          label: 'Rachel',
          prompt: 'What would make the answer believable?',
          answer: 'Rachel wanted names, job/MOS, years served, age range, real raw images, or video of Soldiers.',
          evidence: 'She said video/photo/story context would make the experience vivid, real, and tangible.',
          takeaway: 'Visual support should prove the Soldier voice, not just decorate the response.',
          screenshots: 'images 045-047',
        },
        {
          label: 'Morgan',
          prompt: 'Are these real quotes?',
          answer: 'Quotes appeared with names, but no photo, age, career path, or deeper profile.',
          evidence: 'Morgan wanted a photo, age, where they are now, and a story/profile to prove they are real and relatable.',
          takeaway: 'A quote card can become a trust object if it carries enough human context.',
          screenshots: 'No screenshot available',
        },
        {
          label: 'Shawn',
          prompt: 'What makes the quotes feel impersonal?',
          answer: 'The quote card used acronyms and partial names, but no image or context.',
          evidence: 'Shawn compared the initials to a blank Teams avatar and said a picture would add personality.',
          takeaway: 'The lack of visuals makes real quotes easier to mistake for AI-generated or generic content.',
          screenshots: 'images 033-035',
        },
      ],
      screenshots: ['Primary: Rachel images 045-047', 'Caveat: Shawn images 033-035', 'No screenshot: Morgan quote-profile commentary'],
      issueRecall: [
        'Participants asked for photos, video, MOS/job, age, years served, and source links.',
        'AI-generated or generic imagery can weaken trust rather than support it.',
        'The best supporting visuals are proof assets: real people, real source paths, and relevant page links.',
      ],
      presenterNotes: [
        'The ask is not more stock imagery.',
        'The ask is credible proof: who said this, where did the fact come from, and where can I verify it?',
      ],
    },
  },
  {
    id: 'interpretation-mvp-vs-post-launch',
    section: 'Appendix',
    kind: 'finding',
    visual: 'deepDiveMatrix',
    eyebrow: 'Interpretation synthesis',
    title: 'What this means for MVP and post-launch',
    subtitle: 'The launch story is positive, but the roadmap should prioritize depth, proof, and visual credibility.',
    deepDive: {
      type: 'Enhancement',
      goal: 'Turn the five interpretation themes into a decision-ready readout for what ships, what gets fixed, and what evolves.',
      examples: [
        {
          label: 'MVP-ready',
          prompt: 'What is working well enough to launch?',
          answer: 'Authenticity, trust, guided starting prompts, conversation flow, common-question coverage, and basic boundaries.',
          evidence: 'Participants repeatedly found the experience easy to use, engaging, reasonable, and supported by real Soldier voices.',
          takeaway: 'The core concept is launchable if high-risk answers are tightened.',
          screenshots: 'Use validation slides',
        },
        {
          label: 'Fix now',
          prompt: 'What should be cleaned up before broader exposure?',
          answer: 'Pay, service commitment, sensitive safety, parent intent, quote relevance, and Live Chat labeling.',
          evidence: 'These moments created skepticism, confusion, or an urge to leave for Google, site navigation, or a human.',
          takeaway: 'Immediate fixes should focus on trust leakage, not broad redesign.',
          screenshots: 'Use enhancement slides',
        },
        {
          label: 'Evolve next',
          prompt: 'What becomes the post-launch growth path?',
          answer: 'Source-backed answer modules, richer quote cards, photo/video proof, contextual CTAs, and better intent classes.',
          evidence: 'The transcripts consistently ask for links, citations, human handoff, and visual/person context.',
          takeaway: 'Post-launch evolution should make Army Answers feel like a trusted site concierge.',
          screenshots: 'Use content gap chart',
        },
      ],
      screenshots: ['Use strongest validation slide for MVP-ready', 'Use Shawn/Rachel/Morgan examples for fix-now', 'Use content gap severity chart for evolve-next'],
      issueRecall: [
        'Validation: authenticity, navigation, coverage, boundaries.',
        'Enhancement: quality/depth, sources, quote metadata, visual proof, intent routing.',
        'Roadmap principle: answer first, official proof second, next best route third.',
      ],
      presenterNotes: [
        'This slide is the bridge back from evidence into recommendations.',
        'The message: ship the useful foundation, but do not let shallow high-stakes answers define the experience.',
      ],
    },
  },
]

export const QA_INSIGHTS_V2_LIGHT_SLIDES: QaInsightsSlide[] = [
  {
    id: 'context-goal-method',
    section: 'Overview',
    kind: 'overview',
    visual: 'stats',
    eyebrow: 'Context / Goal / Method',
    title: 'From edit skim to focused story',
    body:
      'Six moderated sessions tested whether Army Answers content felt clear, useful, credible, and ready to guide next steps.',
    stats: [
      { label: 'Participants', value: '6', note: 'Structured in-person content testing sessions.' },
      { label: 'Prompts with gaps', value: '34/41', note: 'Repeated issue patterns drove the synthesis.' },
      { label: 'High-priority issues', value: '13', note: 'High-severity issue tags identified. 6 Low tags were also captured.' },
    ],
    themeSignals: [
      {
        label: 'Trust medium / high',
        value: 5,
        total: 6,
        note: 'Participant-level trust summary: 1 High, 4 Medium, 1 Low.',
      },
      {
        label: 'Helpfulness level',
        value: 13,
        total: 18,
        note: 'Derived from participant-level summaries: 1 High, 5 Medium, 0 Low. High=3, Medium=2, Low=1.',
      },
      {
        label: 'Readiness',
        value: 15,
        total: 41,
        note: 'Readiness proxy for expectations met: 7 Ready + 8 Mostly Ready prompt evaluations.',
      },
    ],
    bullets: [
      'Context: June 11 moderated testing focused on Army Answers content quality, not participant performance.',
      'Goal: understand whether answers felt clear, helpful, accurate, trustworthy, authentic, and appropriate.',
      'Method: synthesize six participant sessions, 41 prompt evaluations, issue tags, and question/answer evidence.',
    ],
  },
  {
    id: 'theme-1-finding',
    section: 'Themes',
    kind: 'theme',
    visual: 'themeCards',
    eyebrow: 'Theme 01',
    title: theme1.title,
    themes: [theme1],
    stats: themeMetrics.relevance,
  },
  {
    id: 'theme-1-evidence',
    section: 'Themes',
    kind: 'evidence',
    visual: 'evidenceGrid',
    eyebrow: 'Theme 01 evidence',
    title: 'Relevance breaks when intent is missed',
    subtitle: 'Question and answer pairs from pay, benefits, and career exploration prompts.',
    evidence: evidence.relevance,
  },
  {
    id: 'theme-2-finding',
    section: 'Themes',
    kind: 'theme',
    visual: 'themeCards',
    eyebrow: 'Theme 02',
    title: theme2.title,
    themes: [theme2],
    stats: themeMetrics.voices,
  },
  {
    id: 'theme-2-evidence',
    section: 'Themes',
    kind: 'evidence',
    visual: 'evidenceGrid',
    eyebrow: 'Theme 02 evidence',
    title: 'Human proof needs specificity',
    subtitle: 'The strongest reactions were about quote fit, repetition, polish, and attribution context.',
    evidence: evidence.voices,
  },
  {
    id: 'theme-3-finding',
    section: 'Themes',
    kind: 'theme',
    visual: 'themeCards',
    eyebrow: 'Theme 03',
    title: theme3.title,
    themes: [theme3],
    stats: themeMetrics.journey,
  },
  {
    id: 'theme-3-evidence',
    section: 'Themes',
    kind: 'evidence',
    visual: 'evidenceGrid',
    eyebrow: 'Theme 03 evidence',
    title: 'Users wanted a next path',
    subtitle: 'The evidence points to routing, source paths, and handoff continuity.',
    evidence: evidence.journey,
  },
  {
    id: 'theme-4-finding',
    section: 'Themes',
    kind: 'theme',
    visual: 'themeCards',
    eyebrow: 'Theme 04',
    title: theme4.title,
    themes: [theme4],
    stats: themeMetrics.trust,
  },
  {
    id: 'theme-4-evidence',
    section: 'Themes',
    kind: 'evidence',
    visual: 'evidenceGrid',
    eyebrow: 'Theme 04 evidence',
    title: 'Trust fails on high-stakes proof',
    subtitle: 'Trust evidence centers on pay, commitment, citations, and sensitive safety handling.',
    evidence: evidence.trust,
  },
  {
    id: 'content-gap-analysis',
    section: 'Findings',
    kind: 'finding',
    visual: 'contentGapAnalysis',
    eyebrow: 'Content gap analysis',
    title: 'Content exists. Retrieval lags.',
    body:
      'The GoArmy sitemap already covers the major prospect decision areas. The gap is that Army Answers does not always retrieve, prioritize, cite, or structure that content in the way users expect.',
    risks: contentGapRisks,
  },
  {
    id: 'next-steps',
    section: 'Recommendations',
    kind: 'roadmap',
    visual: 'roadmap',
    eyebrow: 'Next steps / recommendations',
    title: 'Tighten answers, then validate',
    body:
      'Prioritize direct factual templates and source paths first, then refine quote intelligence and journey routing.',
    roadmap,
  },
  ...deepDiveSlides,
  ...interpretationSlides,
]

export const QA_INSIGHTS_V2_LIGHT_SUMMARY = QA_INSIGHTS_V2_LIGHT_SLIDES
  .map((slide, index) => `${index + 1}. ${slide.title}`)
  .join('\n')
