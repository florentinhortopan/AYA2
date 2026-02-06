# Segue Pills: Data-Driven Selection & Graceful Degradation Strategy

## 🎯 Purpose
Design a production-grade pill selection system that:
1. Uses real market, search, and navigation data when available
2. Scores confidence based on data point availability
3. Gracefully degrades when data is missing or confidence is low
4. Handles edge cases (absurd prompts, unrecognized intents)
5. Customizable per campaign with business goal alignment

---

## 📊 Data Points & Confidence Scoring

### Available Data Points (from ACs)

| Data Point | Weight | Availability | Confidence Contribution |
|-----------|--------|--------------|------------------------|
| **Page (URL + Content)** | 25% | Session-based | Medium-High |
| **Navigation/Source/Referral** | 20% | Session-based | Medium |
| **Sentiment** | 20% | Computed (requires interaction) | Medium-High |
| **Engagement Score** | 25% | Computed (requires history) | High |
| **Campaign Goals** | 10% | Always available | Low (business bias) |

### Future Data Points (Not Yet Available)

| Data Point | Weight | How to Capture | Confidence Contribution |
|-----------|--------|----------------|------------------------|
| **Search Query** | 30% | URL params, search bar | Very High |
| **Market Segment** | 15% | IP geo + profile | Medium |
| **Time on Site** | 10% | Session tracking | Medium |
| **Previous Chat History** | 35% | Database query | Very High |
| **Device/Context** | 5% | User agent | Low |

---

## 🎚️ Confidence Levels & Behavior

### Confidence Tiers

```
┌─────────────────────────────────────────────────────────────┐
│                   CONFIDENCE SPECTRUM                       │
└─────────────────────────────────────────────────────────────┘

  0%          25%          50%          75%         100%
  │            │            │            │            │
  ├────────────┼────────────┼────────────┼────────────┤
  │   NULL     │    LOW     │  MEDIUM    │   HIGH     │
  │  (Case 1)  │            │ (Case 2)   │ (Case 3)   │
  └────────────┴────────────┴────────────┴────────────┘

NULL:    No data points → Generic defaults
LOW:     1-2 data points → Conservative, broad pills
MEDIUM:  3-4 data points → Targeted with fallbacks
HIGH:    5+ data points → Highly personalized
```

### Confidence Calculation Formula

```typescript
confidenceScore = 
  (hasPage         ? 0.25 : 0) +
  (hasNavigation   ? 0.20 : 0) +
  (hasSentiment    ? 0.20 : 0) +
  (hasEngagement   ? 0.25 : 0) +
  (hasCampaignGoal ? 0.10 : 0)

// Future additions:
  (hasSearchQuery      ? 0.30 : 0) +
  (hasMarketSegment    ? 0.15 : 0) +
  (hasChatHistory      ? 0.35 : 0) +
  (hasTimeOnSite       ? 0.10 : 0) +
  (hasDeviceContext    ? 0.05 : 0)
```

---

## 🔄 Graceful Degradation Strategy

### Tier 1: High Confidence (75-100%) - Case 3+
**Available Data:** Page + Navigation + Sentiment + Engagement + Campaign Goal

**Strategy:**
- 2 Anticipate pills: Highly specific to engaged topic
- 1 Entice pill: Adjacent high-value topic
- 1 CTA pill: Strong conversion language

**Example:**
```
User: High engagement on eligibility pages, positive sentiment, from recruiter referral
Pills:
1. "Check your eligibility now" (anticipate)
2. "Next steps to join" (anticipate)
3. "See training options" (entice)
4. "Schedule a recruiter chat" (CTA - strong)
```

**Fallback:** If specific pills unavailable → use topic-level pills instead of subtopic

---

### Tier 2: Medium Confidence (50-75%) - Case 2+
**Available Data:** Page + Navigation OR Page + Campaign Goal

**Strategy:**
- 2 Anticipate pills: Topic-level (broader than Tier 1)
- 1 Entice pill: Safe adjacent topic
- 1 CTA pill: Moderate conversion language

**Example:**
```
User: On benefits page, unknown referral, no sentiment/engagement
Pills:
1. "Explore benefits" (anticipate - broad)
2. "Pay and allowances" (anticipate - specific)
3. "Career options" (entice - adjacent)
4. "Talk to a recruiter" (CTA - moderate)
```

**Fallback:** If topic pills unavailable → use category-level pills

---

### Tier 3: Low Confidence (25-50%) - Case 1.5
**Available Data:** Navigation/Referral only OR Campaign Goal only

**Strategy:**
- 1 Anticipate pill: Based on limited signal
- 1 Orientation pill: "What can you help me with?"
- 1 Popular pill: Most commonly clicked pill overall
- 1 CTA pill: Soft conversion language

**Example:**
```
User: From Google search, no page context, no history
Pills:
1. "What can you help me with?" (orientation)
2. "Explore careers" (popular - most clicked)
3. "Eligibility basics" (popular)
4. "Have questions? Let's chat" (CTA - soft)
```

**Fallback:** If referral-based pills unavailable → use generic default

---

### Tier 4: No Confidence (0-25%) - Case 1
**Available Data:** Null or campaign goal only

**Strategy:**
- 2 Generic Anticipate pills: Safest, broadest topics
- 1 Generic Entice pill: Universal interest
- 1 Generic CTA pill: Very soft language

**Example:**
```
User: No data at all
Pills:
1. "What can you help me with?" (generic)
2. "Explore careers" (generic)
3. "Eligibility basics" (generic)
4. "Talk to a recruiter" (CTA - generic)
```

**Fallback:** Hardcoded default set (never fails)

---

## 🚨 Edge Case Handling

### Edge Case 1: Absurd/Unrecognized User Prompt

**Scenario:** User types something completely off-topic or nonsensical
```
User: "purple elephant skateboard tuesday?"
LLM: Cannot recognize intent
```

**Pill Strategy:**
```typescript
if (chatbotCannotRecognizeIntent) {
  // Serve "recovery pills" - help user get back on track
  pills = [
    "What can you help me with?",     // Orientation
    "Show me career options",         // Popular redirect
    "Eligibility questions",          // Popular redirect
    "Talk to a recruiter"             // Escape hatch
  ]
  
  reasoning = [
    "Intent unclear - offering orientation and popular paths",
    "Recovery mode to help user get back on track"
  ]
}
```

**Visual Indicator:**
```
┌──────────────────────────────────────────────────┐
│ 🤔 Not sure I understood that. Here are some    │
│    ways I can help:                              │
│                                                  │
│    [What can you help me with?]                 │
│    [Show me career options]                     │
│    [Eligibility questions]                      │
│    [Talk to a recruiter]                        │
└──────────────────────────────────────────────────┘
```

---

### Edge Case 2: Conflicting Signals

**Scenario:** Data points contradict each other
```
Page: Benefits (topic = benefits)
Search Query: "army careers" (topic = careers)
Previous Chat: Asked about eligibility (topic = eligibility)
```

**Resolution Strategy:**
```typescript
// Weight by recency and strength
const signals = [
  { source: 'chat_history', topic: 'eligibility', weight: 0.4, recency: 'recent' },
  { source: 'search_query', topic: 'careers', weight: 0.3, recency: 'current' },
  { source: 'page', topic: 'benefits', weight: 0.3, recency: 'current' }
]

// Pick dominant + add diversity
pills = [
  "Check eligibility" (chat history - highest weight),
  "Explore careers" (search query),
  "Benefits breakdown" (page context),
  "Talk to a recruiter" (CTA)
]
```

**Strategy:** Use multiple conflicting signals as diversity, not confusion

---

### Edge Case 3: Low-Quality Data

**Scenario:** Have data points but they're unreliable
```
Sentiment: Neutral (not strong signal)
Engagement: Low (1 page view, 10 seconds)
Page: Homepage (no specific topic)
```

**Confidence Check:**
```typescript
if (confidenceScore < threshold && hasLowQualitySignals) {
  // Degrade to lower tier
  actualTier = Math.max(tier - 1, 1)
  
  // Use broader pills with safety fallbacks
  pills = getLowerTierPills(actualTier)
}
```

---

### Edge Case 4: No Pills Match Available Data

**Scenario:** Data suggests a topic with no pill candidates
```
Page topic: "Army band auditions" (very niche)
No pills in library for this topic
```

**Fallback Strategy:**
```typescript
if (noPillsFoundForTopic) {
  // 1. Try parent category
  if (hasPillsForParentCategory) {
    return getParentCategoryPills() // e.g., "careers" instead of "army band"
  }
  
  // 2. Try adjacent topics
  if (hasAdjacentTopicPills) {
    return getAdjacentPills() // e.g., "training" adjacent to "band"
  }
  
  // 3. Fall back to generic
  return getGenericDefaultPills()
}
```

---

## 🏗️ Implementation Architecture

### Data Collection Layer

```typescript
interface SessionDataProfile {
  // Current session
  page: {
    url: string
    content: string
    topic: string
    timeOnPage: number
  } | null
  
  navigation: {
    source: string        // direct, search, referral, campaign
    referrer: string
    campaignParams: Record<string, string>
  } | null
  
  // Computed/historical
  sentiment: {
    score: number         // -1 to 1
    label: string         // negative, neutral, positive
    confidence: number    // 0 to 1
  } | null
  
  engagement: {
    score: number         // 0 to 100
    level: string         // low, medium, high, very_high
    pagesViewed: number
    totalTime: number
    interactions: number
  } | null
  
  // Future additions
  searchQuery?: string
  marketSegment?: string
  chatHistory?: Array<{ question: string, intent: string }>
  deviceContext?: { type: string, os: string }
  
  // Business context
  campaignGoal: {
    id: string
    name: string
    goalType: string
    businessPrompt: string
    ctaRequirement: any
  } | null
}
```

---

### Confidence Scoring Engine

```typescript
interface ConfidenceScore {
  overall: number          // 0-100
  tier: 1 | 2 | 3 | 4     // Degradation tier
  dataPoints: {
    available: string[]
    missing: string[]
  }
  quality: {
    strong: string[]       // High-quality signals
    weak: string[]         // Low-quality signals
  }
  recommendation: string   // Which strategy to use
}

function calculateConfidence(profile: SessionDataProfile): ConfidenceScore {
  const scores: Record<string, number> = {}
  const weights: Record<string, number> = {
    page: 25,
    navigation: 20,
    sentiment: 20,
    engagement: 25,
    campaignGoal: 10,
    // Future
    searchQuery: 30,
    chatHistory: 35,
    marketSegment: 15,
    timeOnSite: 10,
    deviceContext: 5
  }
  
  let totalScore = 0
  let maxPossibleScore = 0
  const available: string[] = []
  const missing: string[] = []
  const strong: string[] = []
  const weak: string[] = []
  
  // Evaluate each data point
  Object.keys(weights).forEach(key => {
    const weight = weights[key]
    maxPossibleScore += weight
    
    if (profile[key as keyof SessionDataProfile]) {
      // Check quality
      const quality = evaluateDataQuality(key, profile[key as keyof SessionDataProfile])
      
      if (quality > 0.7) {
        totalScore += weight
        available.push(key)
        strong.push(key)
      } else if (quality > 0.3) {
        totalScore += weight * quality
        available.push(key)
        weak.push(key)
      } else {
        missing.push(key)
      }
    } else {
      missing.push(key)
    }
  })
  
  const overall = (totalScore / maxPossibleScore) * 100
  
  // Determine tier
  let tier: 1 | 2 | 3 | 4
  if (overall >= 75) tier = 4      // High confidence
  else if (overall >= 50) tier = 3  // Medium confidence
  else if (overall >= 25) tier = 2  // Low confidence
  else tier = 1                     // No confidence
  
  return {
    overall,
    tier,
    dataPoints: { available, missing },
    quality: { strong, weak },
    recommendation: getStrategyRecommendation(tier, strong, weak)
  }
}

function evaluateDataQuality(dataPoint: string, value: any): number {
  switch (dataPoint) {
    case 'page':
      // Quality based on time on page and content specificity
      return value.timeOnPage > 30 ? 1.0 : 0.5
      
    case 'sentiment':
      // Quality based on confidence score
      return value.confidence || 0.5
      
    case 'engagement':
      // Quality based on interactions and time
      if (value.score > 70) return 1.0
      if (value.score > 40) return 0.7
      return 0.4
      
    case 'navigation':
      // Quality based on source specificity
      if (value.source === 'campaign') return 0.9
      if (value.source === 'search') return 0.8
      if (value.source === 'referral') return 0.6
      return 0.3
      
    default:
      return 0.5
  }
}

function getStrategyRecommendation(
  tier: number, 
  strong: string[], 
  weak: string[]
): string {
  if (tier === 4) return 'Use highly personalized pills with strong CTA'
  if (tier === 3) return 'Use topic-specific pills with moderate personalization'
  if (tier === 2) return 'Use category-level pills with safe defaults'
  return 'Use generic default pills only'
}
```

---

## 🎯 Pill Selection Algorithm (Production Version)

### Main Selection Function

```typescript
async function selectSegueePills(
  profile: SessionDataProfile,
  pillLibrary: PillLabel[]
): Promise<{
  pills: PillLabel[]
  confidence: ConfidenceScore
  reasoning: string[]
  fallbacksUsed: string[]
}> {
  
  // Step 1: Calculate confidence
  const confidence = calculateConfidence(profile)
  
  // Step 2: Apply degradation strategy
  const strategy = getStrategyForTier(confidence.tier)
  
  // Step 3: Select pills with fallback chain
  const { pills, fallbacks } = await selectPillsWithFallbacks(
    profile,
    pillLibrary,
    strategy,
    confidence
  )
  
  // Step 4: Enforce campaign goals
  const finalPills = enforceCampaignGoals(
    pills,
    profile.campaignGoal,
    confidence.tier
  )
  
  // Step 5: Validate & apply safety rules
  const validatedPills = validateAndSanitize(finalPills, profile)
  
  return {
    pills: validatedPills,
    confidence,
    reasoning: buildReasoning(confidence, strategy, fallbacks),
    fallbacksUsed: fallbacks
  }
}
```

---

### Fallback Chain (Graceful Degradation)

```typescript
async function selectPillsWithFallbacks(
  profile: SessionDataProfile,
  pillLibrary: PillLabel[],
  strategy: SelectionStrategy,
  confidence: ConfidenceScore
): Promise<{ pills: PillLabel[], fallbacks: string[] }> {
  
  const fallbacks: string[] = []
  let pills: PillLabel[] = []
  
  // ATTEMPT 1: Use primary strategy (tier-appropriate)
  try {
    pills = await selectPillsByStrategy(profile, pillLibrary, strategy)
    if (pills.length >= 4) {
      return { pills: pills.slice(0, 4), fallbacks }
    }
  } catch (err) {
    fallbacks.push('Primary strategy failed')
  }
  
  // ATTEMPT 2: Degrade one tier
  if (pills.length < 4 && confidence.tier > 1) {
    fallbacks.push(`Degraded from Tier ${confidence.tier} to Tier ${confidence.tier - 1}`)
    const lowerStrategy = getStrategyForTier(confidence.tier - 1)
    try {
      const lowerPills = await selectPillsByStrategy(profile, pillLibrary, lowerStrategy)
      pills = [...pills, ...lowerPills.filter(p => !pills.find(existing => existing.id === p.id))]
      if (pills.length >= 4) {
        return { pills: pills.slice(0, 4), fallbacks }
      }
    } catch (err) {
      fallbacks.push('Lower tier strategy failed')
    }
  }
  
  // ATTEMPT 3: Use topic-level pills (ignore specificity)
  if (pills.length < 4 && profile.page?.topic) {
    fallbacks.push('Using topic-level pills')
    const topicPills = pillLibrary.filter(p => 
      p.intent.toLowerCase().includes(profile.page!.topic.toLowerCase())
    )
    pills = [...pills, ...topicPills.filter(p => !pills.find(existing => existing.id === p.id))]
    if (pills.length >= 4) {
      return { pills: pills.slice(0, 4), fallbacks }
    }
  }
  
  // ATTEMPT 4: Use most popular pills (crowd-sourced fallback)
  if (pills.length < 4) {
    fallbacks.push('Using most popular pills')
    const popularPills = await getMostClickedPills(pillLibrary)
    pills = [...pills, ...popularPills.filter(p => !pills.find(existing => existing.id === p.id))]
    if (pills.length >= 4) {
      return { pills: pills.slice(0, 4), fallbacks }
    }
  }
  
  // ATTEMPT 5: Hardcoded generic default (NEVER FAILS)
  fallbacks.push('Using hardcoded generic default')
  const hardcodedDefault = getHardcodedDefaultPills(pillLibrary)
  pills = [...pills, ...hardcodedDefault.filter(p => !pills.find(existing => existing.id === p.id))]
  
  return { pills: pills.slice(0, 4), fallbacks }
}
```

---

## 🛡️ Safety Rules & Validation

### Validation Checks

```typescript
function validateAndSanitize(
  pills: PillLabel[],
  profile: SessionDataProfile
): PillLabel[] {
  
  // Rule 1: No duplicate intents (max 2 pills per intent)
  const intentCounts: Record<string, number> = {}
  pills = pills.filter(pill => {
    intentCounts[pill.intent] = (intentCounts[pill.intent] || 0) + 1
    return intentCounts[pill.intent] <= 2
  })
  
  // Rule 2: No contradiction with known negative sentiment
  if (profile.sentiment?.label === 'negative') {
    pills = pills.filter(pill => {
      // Remove overly aggressive CTAs
      const aggressive = ['schedule now', 'sign up today', 'join immediately']
      return !aggressive.some(term => pill.label.toLowerCase().includes(term))
    })
  }
  
  // Rule 3: At least 2 different categories
  const categories = [...new Set(pills.map(p => p.intent))]
  if (categories.length < 2) {
    // Add a pill from a different category
    const differentCategoryPill = pillLibrary.find(p => 
      !pills.find(existing => existing.id === p.id) &&
      !categories.includes(p.intent)
    )
    if (differentCategoryPill) {
      pills[pills.length - 1] = differentCategoryPill
    }
  }
  
  // Rule 4: CTA pill count limits (campaign goal overrides)
  const ctaCount = pills.filter(p => p.type === 'cta').length
  const maxCtas = profile.campaignGoal?.ctaRequirement?.maxCount || 2
  const minCtas = profile.campaignGoal?.ctaRequirement?.minCount || 1
  
  if (ctaCount > maxCtas) {
    // Remove excess CTAs (keep required ones)
    const requiredLabels = profile.campaignGoal?.ctaRequirement?.requiredPills || []
    pills = pills.filter(p => 
      p.type !== 'cta' || 
      requiredLabels.some((req: string) => p.label.toLowerCase().includes(req.toLowerCase())) ||
      pills.filter(pill => pill.type === 'cta').indexOf(p) < minCtas
    )
  }
  
  if (ctaCount < minCtas) {
    // Add more CTA pills to meet minimum
    const additionalCtas = pillLibrary.filter(p => 
      p.type === 'cta' &&
      !pills.find(existing => existing.id === p.id)
    )
    pills.push(...additionalCtas.slice(0, minCtas - ctaCount))
  }
  
  // Rule 5: Always have exactly 4 pills
  while (pills.length < 4) {
    const fallbackPill = getNextBestPill(pills, pillLibrary)
    if (fallbackPill) pills.push(fallbackPill)
    else break
  }
  
  return pills.slice(0, 4)
}
```

---

## 📈 Future Data Integration Points

### 1. Real-Time Search Data

**Integration Point:**
```typescript
// When user arrives from search
if (profile.navigation?.source === 'search' && searchQuery) {
  // Match search intent to pill intents
  const searchIntent = await classifySearchIntent(searchQuery)
  
  // Boost pills matching search intent
  pills = boostPillsByIntent(pills, searchIntent, multiplier: 1.5)
}
```

**Example:**
```
Search: "how to become an army officer"
→ Boost: "Officer career paths", "Check officer eligibility"
→ Include: "Talk to a recruiter" (CTA)
```

---

### 2. Market Segmentation

**Integration Point:**
```typescript
// Determine market segment
const segment = await getMarketSegment(profile)
// Segments: high_school, career_changer, veteran_family, college_student

// Adjust pill language per segment
pills = pills.map(pill => 
  personalizeLanguageForSegment(pill, segment)
)
```

**Example:**
```
Segment: high_school
Pill: "Explore careers" → "What jobs can I do?"

Segment: career_changer
Pill: "Explore careers" → "Compare to civilian careers"
```

---

### 3. Previous Chat History

**Integration Point:**
```typescript
// If user has chatted before
if (profile.chatHistory && profile.chatHistory.length > 0) {
  const recentTopics = extractTopicsFromHistory(profile.chatHistory)
  const lastIntent = profile.chatHistory[profile.chatHistory.length - 1].intent
  
  // Offer continuation pills
  pills = [
    getContinuationPill(lastIntent),  // "Continue where we left off"
    ...getRelatedPills(recentTopics, 2),
    getCTAPill()
  ]
}
```

**Example:**
```
Last chat: Asked about eligibility, got answer about GED requirements
New pills:
1. "Check eligibility with GED" (continuation)
2. "Next steps to join" (progression)
3. "See waivers available" (related)
4. "Talk to a recruiter" (CTA)
```

---

### 4. A/B Testing & Learning

**Integration Point:**
```typescript
// Track pill performance
interface PillPerformance {
  pillId: string
  label: string
  context: SessionDataProfile
  
  // Metrics
  shown: number
  clicked: number
  ctr: number
  
  // Outcomes
  chatCompletions: number
  ctaReached: number
  conversionRate: number
  
  // Time-based
  firstShown: Date
  lastShown: Date
  avgTimeToClick: number
}

// Use performance data to adjust pill selection
function selectPillsWithLearning(
  pills: PillLabel[],
  context: SessionDataProfile
): PillLabel[] {
  
  // Get performance for similar contexts
  const similarContexts = await getPillPerformanceForContext(context)
  
  // Boost high-performing pills
  pills = pills.map(pill => {
    const perf = similarContexts.find(p => p.pillId === pill.id)
    if (perf && perf.conversionRate > 0.15) {
      return { ...pill, confidence: pill.confidence * 1.3 }
    }
    return pill
  })
  
  // Sort by adjusted confidence
  return pills.sort((a, b) => b.confidence - a.confidence)
}
```

---

## 🚨 Edge Case: Recovery Pills for Absurd Prompts

### Detection Strategy

```typescript
function detectAbsurdPrompt(userInput: string): {
  isAbsurd: boolean
  reason: string
  confidence: number
} {
  
  // Check 1: LLM cannot classify intent
  const intent = await classifyIntent(userInput)
  if (intent.confidence < 0.3) {
    return {
      isAbsurd: true,
      reason: 'Intent unrecognizable',
      confidence: 1 - intent.confidence
    }
  }
  
  // Check 2: Contains nonsensical patterns
  const nonsensicalPatterns = [
    /\b(purple|banana|skateboard|elephant)\b.*\b(tuesday|army|join)\b/i,
    /^[a-z]{1,2}$/i,  // Single letters
    /(.)\1{10,}/,     // Repeated characters
  ]
  
  if (nonsensicalPatterns.some(pattern => pattern.test(userInput))) {
    return {
      isAbsurd: true,
      reason: 'Nonsensical pattern detected',
      confidence: 0.9
    }
  }
  
  // Check 3: Completely off-topic
  const armyRelatedKeywords = [
    'army', 'military', 'soldier', 'join', 'career', 'benefits',
    'training', 'eligibility', 'recruiter', 'enlist', 'officer'
  ]
  
  const containsArmyKeyword = armyRelatedKeywords.some(keyword => 
    userInput.toLowerCase().includes(keyword)
  )
  
  if (!containsArmyKeyword && userInput.length > 10) {
    return {
      isAbsurd: true,
      reason: 'Completely off-topic',
      confidence: 0.7
    }
  }
  
  return { isAbsurd: false, reason: '', confidence: 0 }
}
```

---

### Recovery Pill Strategy

```typescript
function getRecoveryPills(
  absurdDetection: { isAbsurd: boolean, reason: string },
  pillLibrary: PillLabel[]
): {
  pills: PillLabel[]
  message: string
  reasoning: string[]
} {
  
  const recoveryMessage = getRecoveryMessage(absurdDetection.reason)
  
  // Recovery pills: orientation + popular + CTA
  const pills = [
    // 1. Orientation (help user understand what's possible)
    pillLibrary.find(p => 
      p.label.toLowerCase().includes('help') ||
      p.label.toLowerCase().includes('what can you')
    ),
    
    // 2-3. Most popular pills (crowd-sourced safety)
    ...getMostClickedPills(pillLibrary, 2),
    
    // 4. Recruiter escape hatch (human fallback)
    pillLibrary.find(p => 
      p.type === 'cta' &&
      p.label.toLowerCase().includes('recruiter')
    )
  ].filter(Boolean) as PillLabel[]
  
  return {
    pills: pills.slice(0, 4),
    message: recoveryMessage,
    reasoning: [
      `Intent unclear: ${absurdDetection.reason}`,
      'Offering orientation and popular paths',
      'Recovery mode to help user get back on track',
      'Recruiter CTA as human fallback option'
    ]
  }
}

function getRecoveryMessage(reason: string): string {
  switch (reason) {
    case 'Intent unrecognizable':
      return "🤔 I'm not quite sure I understood that. Here are some ways I can help:"
    case 'Nonsensical pattern detected':
      return "🤔 Hmm, I didn't catch that. Let me show you what I can help with:"
    case 'Completely off-topic':
      return "🤔 I specialize in Army recruitment questions. Here's what I can help with:"
    default:
      return "🤔 Not sure I understood. Here are some things I can help with:"
  }
}
```

---

## 🎛️ Customization Interface

### Campaign Goal Editor (Enhanced)

```typescript
interface EnhancedCampaignGoal {
  // Basic info
  name: string
  goalType: string
  description: string
  
  // Business rules
  businessPrompt: string
  ctaRequirement: {
    minCount: number
    maxCount: number
    requiredPills: string[]
  }
  
  // NEW: Tier-specific overrides
  tierOverrides: {
    tier1: {
      ctaCount: number        // Override CTA count for low confidence
      forcedPills?: string[]  // Different required pills for this tier
    }
    tier2: {
      ctaCount: number
      forcedPills?: string[]
    }
    tier3: {
      ctaCount: number
      forcedPills?: string[]
    }
    tier4: {
      ctaCount: number
      forcedPills?: string[]
    }
  }
  
  // NEW: Data quality requirements
  qualityThresholds: {
    minConfidence: number           // Don't use this goal if confidence < threshold
    requiredDataPoints?: string[]   // Only use if these data points available
  }
  
  // NEW: A/B testing
  abTest?: {
    enabled: boolean
    variants: Array<{
      name: string
      weight: number
      pillOverrides: string[]
    }>
  }
}
```

**UI for Enhanced Configuration:**
```
┌─────────────────────────────────────────────────────────────┐
│  CREATE CAMPAIGN GOAL                                       │
├─────────────────────────────────────────────────────────────┤
│  Name: [Q1 2026 Recruiter Push              ]              │
│  Type: [Recruiter Contact ▾]                               │
│                                                             │
│  📝 Business Prompt:                                        │
│  [Prioritize pills that lead to recruiter contact...]      │
│                                                             │
│  🎯 CTA Requirements (Global):                              │
│  Min Pills: [1] Max Pills: [2]                             │
│  Required Pills: [Talk to a recruiter, Schedule a chat]    │
│                                                             │
│  ⚙️ Tier-Specific Overrides:                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Tier 1 (Low Confidence):                              │ │
│  │ CTA Count: [1] (softer approach for unknown users)   │ │
│  │ Forced Pills: [Have questions? Let's chat]           │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Tier 4 (High Confidence):                             │ │
│  │ CTA Count: [2] (aggressive for engaged users)        │ │
│  │ Forced Pills: [Schedule a recruiter chat, Apply now] │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  🎚️ Quality Requirements:                                   │
│  Min Confidence: [50%] (only use this goal if 50%+)        │
│  Required Data: [☑ Page  ☑ Sentiment  ☐ Engagement]       │
│                                                             │
│  🧪 A/B Testing:                                            │
│  [☑ Enable A/B Test]                                       │
│  Variant A (50%): Default pills                            │
│  Variant B (50%): [Alternative pill set...]                │
│                                                             │
│  [Create Goal] [Cancel]                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Monitoring & Optimization Dashboard

### Real-Time Metrics to Track

```typescript
interface PillMetrics {
  // Per-pill metrics
  pillPerformance: {
    pillId: string
    label: string
    
    // Engagement
    impressions: number
    clicks: number
    ctr: number
    
    // Context breakdown
    byConfidenceTier: Record<1 | 2 | 3 | 4, {
      impressions: number
      clicks: number
      ctr: number
    }>
    
    byTopic: Record<string, {
      impressions: number
      clicks: number
      ctr: number
    }>
    
    // Outcomes
    chatCompletions: number
    ctaReached: number
    conversionRate: number
  }
  
  // System health
  systemMetrics: {
    avgConfidenceScore: number
    tierDistribution: Record<1 | 2 | 3 | 4, number>
    fallbackUsageRate: number
    absurdPromptRate: number
    recoverySuccessRate: number
  }
  
  // Campaign effectiveness
  campaignMetrics: Record<string, {
    goalId: string
    goalName: string
    pillsServed: number
    requiredPillCTR: number
    goalCompletionRate: number
  }>
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Current Sprint)
- ✅ Basic synthetic question generation
- ✅ Intent clustering
- ✅ Simple recommendation engine
- ✅ Campaign goal support
- ✅ Project import

### Phase 2: Confidence System (Next Sprint)
- [ ] Implement confidence scoring function
- [ ] Add tier-based degradation logic
- [ ] Build fallback chain
- [ ] Add validation rules
- [ ] UI showing confidence scores

### Phase 3: Edge Case Handling (Sprint +2)
- [ ] Absurd prompt detection
- [ ] Recovery pill system
- [ ] Conflict resolution for contradicting signals
- [ ] Low-quality data handling

### Phase 4: Real Data Integration (Sprint +3)
- [ ] Search query capture & classification
- [ ] Market segmentation
- [ ] Chat history integration
- [ ] Time-on-site tracking

### Phase 5: Learning & Optimization (Sprint +4)
- [ ] Pill performance tracking
- [ ] A/B testing framework
- [ ] Automatic pill promotion/demotion
- [ ] Metrics dashboard

---

## 💡 Immediate Quick Wins

### You Can Do Right Now:

**1. Add Confidence Display**
Show confidence score in the UI so you can audit decisions:
```
┌────────────────────────────────────────────┐
│ Confidence: 75% (Medium-High)              │
│ Data Available: Page, Navigation           │
│ Data Missing: Sentiment, Engagement        │
│ Strategy: Topic-specific with fallbacks    │
└────────────────────────────────────────────┘
```

**2. Hardcoded Fallback Set**
Define a guaranteed-safe default that never fails:
```typescript
const HARDCODED_FALLBACK = [
  "What can you help me with?",
  "Explore careers",
  "Eligibility basics",
  "Talk to a recruiter"
]
```

**3. Popular Pills Tracking**
Start tracking which pills get clicked most → use for fallbacks:
```sql
SELECT pill_label, COUNT(*) as clicks
FROM SegueTestSession
WHERE clickedPillLabel IS NOT NULL
GROUP BY pill_label
ORDER BY clicks DESC
LIMIT 10
```

---

## 📝 Summary

**Your Vision:**
- ✅ Real data integration (search, market, navigation)
- ✅ Confidence-based selection
- ✅ Graceful degradation when data missing
- ✅ Edge case handling for absurd prompts
- ✅ Campaign goal customization

**Implementation Path:**
1. Phase 2: Add confidence scoring (2-3 days)
2. Phase 3: Add edge case handling (2 days)
3. Phase 4: Integrate real data (1 week)
4. Phase 5: Add learning/optimization (1 week)

**Total:** ~3-4 weeks for full production system

---

Would you like me to start implementing **Phase 2 (Confidence System)** now, or should I document this strategy and wait for your go-ahead?