# Army Answers Chatbot Segue Pills Strategy

## 🎯 Purpose
Define a controllable, data-driven approach for the first segue pills shown when a user opens the chat widget. The strategy balances:

```
┌─────────────┐     ┌─────────────────┐     ┌────────────────┐
│  RELEVANCY  │  +  │ PREDICTABILITY  │  +  │ BUSINESS GOALS │
│   (Heard)   │     │   (Inferred)    │     │   (Nudging)    │
└─────────────┘     └─────────────────┘     └────────────────┘
        ↓                    ↓                       ↓
        └────────────────────┴───────────────────────┘
                             ↓
                    ┌────────────────────┐
                    │  4 SEGUE PILLS     │
                    │  (2 Anticipate +   │
                    │   2 Entice)        │
                    └────────────────────┘
```

**Time-boxed:** Current sprint  
**Output:** Requirements list + copy guidance

## 📋 Story Context (Jira)

> **As a** person exploring Army Answers,  
> **I want** to feel guided and supported as I explore the experience, with valuable and engaging segues when accessing the chat widget, with clear next steps and a relevant set of options,  
> **So that** I have a meaningful conversation that provides useful information and I take an action. I should find what I was looking for and be pleasantly surprised by what I did not know I was looking for.

---

## 🔧 Assumptions

✅ The tech team can implement the 3 acceptance-criteria cases so data points can modify UX as expected.

### Available Data Points

| Data Point | Description | Available In |
|-----------|-------------|--------------|
| **null** | No user/session data | Case 1 |
| **page** | URL + page content | Case 2, 3 |
| **navigation/source/referral** | How user arrived | Case 2, 3 |
| **sentiment** | Positive/neutral/negative tone | Case 3 |
| **engagement score** | Time on site, pages viewed, interactions | Case 3 |
| **campaign goals** | Active campaign CTA targets | Case 2, 3 |

---

## 🗺️ Strategy Overview Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER OPENS CHAT WIDGET                       │
└───────────────────────────────┬─────────────────────────────────┘
                                ↓
                    ┌───────────────────────┐
                    │  Assess Data Quality  │
                    └───────────────────────┘
                                ↓
        ┌───────────────────────┼───────────────────────┐
        ↓                       ↓                       ↓
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   CASE 1     │      │   CASE 2     │      │   CASE 3     │
│              │      │              │      │              │
│ NULL Data    │      │ PARTIAL Data │      │ RICH Data    │
│ ⚫ No signals │      │ 🟡 Some signals│     │ 🟢 Full profile│
│              │      │              │      │              │
│ Strategy:    │      │ Strategy:    │      │ Strategy:    │
│ Generic      │      │ Page-based + │      │ Behavior +   │
│ Default      │      │ Adjacent     │      │ Strong CTA   │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       ↓                     ↓                      ↓
       └─────────────────────┴──────────────────────┘
                             ↓
              ┌──────────────────────────┐
              │   4 SEGUE PILLS          │
              │   • 2 Anticipate         │
              │   • 2 Entice             │
              │   Filtered by:           │
              │   - Diversity            │
              │   - No contradiction     │
              │   - CTA cap (1-2 max)    │
              └──────────────────────────┘
                             ↓
              ┌──────────────────────────┐
              │   USER CLICKS & ENGAGES  │
              │   → Measure & Optimize   │
              └──────────────────────────┘
```

---

## 📖 Definitions

| Term | Definition | Example |
|------|------------|---------|
| **Segue Pills** | Short, clickable prompts displayed at chat open that help a user start or steer the conversation | "Explore careers" |
| **Generic Default** | Baseline pills shown when no meaningful user/session data is available. Must be broad, non-presumptive, and safe across audiences | Case 1 pill set |
| **Anticipate Pills** | Pills that reflect likely intent based on known signals; should feel "expected" and relevant | User on benefits page → "Benefits breakdown" |
| **Entice Pills** | Pills that open adjacent or higher-value pathways; should feel useful or inspiring without being off-topic | User on benefits page → "Talk to a recruiter" |

### 🔄 Anticipate vs. Entice Visual

```
┌────────────────────────────────────────────────────────────┐
│                      4-PILL STRUCTURE                      │
├──────────────────────────────┬─────────────────────────────┤
│     ANTICIPATE (2)           │      ENTICE (2)             │
│  ✓ Based on known signals    │  ✨ Adjacent opportunities   │
│  ✓ Feels expected/relevant   │  ✨ Higher-value pathways    │
│  ✓ "You were looking for X"  │  ✨ "You might also want Y"  │
└──────────────────────────────┴─────────────────────────────┘
```

## 💊 Pill Count & Structure

```
╔═══════════════════════════════════════════════════╗
║           CHATBOT FIRST OPEN EXPERIENCE          ║
╠═══════════════════════════════════════════════════╣
║  Total Pills: 4                                   ║
║                                                   ║
║  [Pill 1: Anticipate]  [Pill 2: Anticipate]     ║
║  [Pill 3: Entice]      [Pill 4: Entice]         ║
║                                                   ║
║  Note: Business goals influence selection        ║
║        and ordering but do NOT increase count    ║
╚═══════════════════════════════════════════════════╝
```

| Component | Count | Purpose |
|-----------|-------|---------|
| **Anticipate Pills** | 2 | Reflect known/inferred intent |
| **Entice Pills** | 2 | Adjacent topics + business nudge |
| **Total** | **4** | Fixed across all use cases |

## 🎬 Acceptance Criteria: Use Cases & Interactions

### 📊 Quick Comparison: All Three Cases

| Aspect | Case 1: Unknown User | Case 2: Some Data | Case 3: Rich Data |
|--------|---------------------|-------------------|-------------------|
| **Data Signal** | ⚫ NULL | 🟡 Page + Nav/Referral | 🟢 Page + Nav + Sentiment + Engagement |
| **Confidence** | None | Low-Medium | Medium-High |
| **Strategy** | Generic default | Page-based relevance | Behavior-driven + CTA |
| **Pill Mix** | 2 default Anticipate<br>2 default Entice | 2 page Anticipate<br>2 adjacent Entice | 2 behavior Anticipate<br>2 goal-aligned Entice |
| **Business CTA** | 1 soft CTA | 1 CTA | 1–2 CTA (sentiment-adjusted) |
| **Example Pills** | "What can you help me with?"<br>"Explore careers"<br>"Eligibility basics"<br>"Talk to a recruiter" | "Compare career paths"<br>"See job requirements"<br>"Training overview"<br>"Talk to a recruiter" | "Check eligibility now"<br>"Next steps to join"<br>"Schedule a recruiter chat"<br>"See training timeline" |

---

### 📍 Case 1 — We don't know anything about them (Generic Default)

```
┌────────────────────────────────────────────────────────────┐
│  USER PROFILE                                              │
├────────────────────────────────────────────────────────────┤
│  Data Quality:    ⚫ NULL                                  │
│  Confidence:      ⬇️ None                                  │
│  Session Signals: ❌ No data available                     │
└────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────┐
│  STRATEGY                                                  │
├────────────────────────────────────────────────────────────┤
│  Objective: Provide safe, helpful entry points            │
│  Pill Logic: Show default pills (broadly useful)          │
│  Approach:   Generic + non-presumptive                     │
└────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────┐
│  PILL OUTPUT (4 Pills)                                     │
├────────────────────────────────────────────────────────────┤
│  1️⃣ "What can you help me with?"      [Anticipate]       │
│  2️⃣ "Explore careers"                 [Anticipate]       │
│  3️⃣ "Eligibility basics"              [Entice]           │
│  4️⃣ "Talk to a recruiter"             [Entice + CTA]     │
└────────────────────────────────────────────────────────────┘
```

**✅ Rationale:**
- ✓ Covers most common first-time intents (orientation, careers, eligibility, CTA)
- ✓ Includes business CTA in a non-pushy way
- ✓ Safe across all user segments

---

### 📍 Case 2 — We know something about them (Low-to-Medium Confidence)

```
┌────────────────────────────────────────────────────────────┐
│  USER PROFILE                                              │
├────────────────────────────────────────────────────────────┤
│  Data Quality:    🟡 Partial                               │
│  Confidence:      ⬆️ Low-to-Medium                         │
│  Session Signals:                                          │
│    ✓ Page URL + content                                   │
│    ✓ Navigation/source/referral                           │
│    ~ Minimal engagement/sentiment                         │
└────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────┐
│  STRATEGY                                                  │
├────────────────────────────────────────────────────────────┤
│  Objective: Demonstrate relevance + safe exploration      │
│  Pill Logic: 2 Anticipate (page/referral context)         │
│              2 Entice (adjacent + campaign goals)         │
└────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────┐
│  PILL OUTPUT EXAMPLES                                      │
├────────────────────────────────────────────────────────────┤
│  Scenario A: Entry page = Career Exploration              │
│  1️⃣ "Compare career paths"           [Anticipate]        │
│  2️⃣ "See job requirements"           [Anticipate]        │
│  3️⃣ "Training overview"              [Entice]            │
│  4️⃣ "Talk to a recruiter"            [Entice + CTA]      │
│                                                            │
│  Scenario B: Entry page = Benefits                        │
│  1️⃣ "Benefits breakdown"             [Anticipate]        │
│  2️⃣ "Pay and allowances"             [Anticipate]        │
│  3️⃣ "Eligibility basics"             [Entice]            │
│  4️⃣ "Talk to a recruiter"            [Entice + CTA]      │
└────────────────────────────────────────────────────────────┘
```

**🎯 Selection Rules:**
- ✓ Anticipate pills **must** be derived from page content or referral context
- ✓ Entice pills **must** be adjacent in topic OR aligned to campaign goals
- ❌ No random/unrelated pills

---

### 📍 Case 3 — We know a lot about them (Medium-to-High Confidence)

```
┌────────────────────────────────────────────────────────────┐
│  USER PROFILE                                              │
├────────────────────────────────────────────────────────────┤
│  Data Quality:    🟢 Rich                                  │
│  Confidence:      ⬆️⬆️ Medium-to-High                      │
│  Session Signals:                                          │
│    ✓ Page URL + content                                   │
│    ✓ Navigation/source/referral                           │
│    ✓ Sentiment score                                      │
│    ✓ Engagement score                                     │
│    ✓ Campaign goals                                       │
└────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────┐
│  STRATEGY                                                  │
├────────────────────────────────────────────────────────────┤
│  Objective: Tailor to session intent + guide to outcome   │
│  Pill Logic: 2 Anticipate (behavior-driven)               │
│              2 Entice (business goal nudge)               │
│  Adaptation: Sentiment adjusts CTA phrasing               │
└────────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────────────┐
│  PILL OUTPUT EXAMPLES                                      │
├────────────────────────────────────────────────────────────┤
│  Scenario A: High engagement + Positive sentiment          │
│              Topic = Eligibility                           │
│  1️⃣ "Check eligibility now"          [Anticipate]        │
│  2️⃣ "Next steps to join"             [Anticipate]        │
│  3️⃣ "Schedule a recruiter chat"      [Entice + CTA]      │
│  4️⃣ "See training timeline"          [Entice]            │
│                                                            │
│  Scenario B: High engagement + Neutral sentiment           │
│              Topic = Career Path                           │
│  1️⃣ "Find roles that fit me"         [Anticipate]        │
│  2️⃣ "Compare MOS options"            [Anticipate]        │
│  3️⃣ "Talk to a recruiter"            [Entice + CTA]      │
│  4️⃣ "Explore benefits"               [Entice]            │
└────────────────────────────────────────────────────────────┘
```

**🎯 Selection Rules:**
- ✓ Anticipate pills **must** reflect most recent OR most engaged topic
- ✓ Entice pills **must** include ≥1 CTA-aligned pill when campaign goals exist
- ⚠️ If sentiment = negative → use softer CTA phrasing (avoid pushy language)
- ⚠️ If sentiment = positive → use stronger conversion language

## 🎛️ Pill Selection Rules (Control Layer)

```
┌─────────────────────────────────────────────────────────────┐
│                   DECISION FLOWCHART                        │
└─────────────────────────────────────────────────────────────┘

       [User Opens Chat]
              ↓
       ┌──────────────┐
       │ Data Quality │
       │  Assessment  │
       └──────────────┘
              ↓
    ┌─────────┴─────────┬─────────────┐
    ↓                   ↓             ↓
 ⚫ NULL          🟡 PARTIAL      🟢 RICH
    │                   │             │
    ↓                   ↓             ↓
[Case 1]           [Case 2]      [Case 3]
Generic            2 Ant + 2 Ent  2 Ant + 2 Ent
Default            (page-based)   (behavior + CTA)
    │                   │             │
    └─────────┬─────────┴─────────────┘
              ↓
     ┌────────────────┐
     │ Apply Filters: │
     │ 1. Diversity   │
     │ 2. No conflict │
     │ 3. CTA cap     │
     └────────────────┘
              ↓
     ┌────────────────┐
     │  4 Final Pills │
     └────────────────┘
```

### Rule Details

| # | Rule | Description | Example |
|---|------|-------------|---------|
| **1** | **Confidence Gate** | Route to appropriate case based on data quality | NULL → Case 1; Partial → Case 2; Rich → Case 3 |
| **2** | **Diversity** | Pills must span ≥2 categories | ✅ Careers + Eligibility<br>❌ All Career pills |
| **3** | **No Contradiction** | Do not show pills that conflict with known intent or sentiment | ❌ User on benefits page → "Explore careers only"<br>✅ User on benefits → "Benefits breakdown" |
| **4** | **Campaign Nudge Cap** | Max 1–2 business-goal pills in first set | ✅ 1 CTA pill<br>❌ 3+ CTA pills |

## 📚 Pill Library (Draft, Simple Phrasing)

Pills must be **simple derivatives of real Q&A topics**, written in **plain language**.

| Category | Pill Label | Type | Use Case(s) |
|----------|-----------|------|-------------|
| **🧭 Orientation** | "What can you help me with?" | Anticipate | Case 1 |
| | "How does this work?" | Anticipate | Case 1 |
| **💼 Careers** | "Explore careers" | Anticipate | Case 1, 2 |
| | "Compare career paths" | Anticipate | Case 2, 3 |
| | "Find roles that fit me" | Anticipate | Case 3 |
| | "See job requirements" | Anticipate | Case 2 |
| | "Compare MOS options" | Anticipate | Case 3 |
| **✅ Eligibility** | "Eligibility basics" | Anticipate/Entice | Case 1, 2 |
| | "Check eligibility now" | Anticipate | Case 3 |
| | "Next steps to join" | Anticipate | Case 3 |
| **💰 Benefits** | "Benefits breakdown" | Anticipate | Case 2 |
| | "Pay and allowances" | Anticipate | Case 2 |
| | "Explore benefits" | Entice | Case 3 |
| **🎓 Training** | "Training overview" | Entice | Case 2 |
| | "See training timeline" | Entice | Case 3 |
| **📞 CTA** | "Talk to a recruiter" | Entice + CTA | All Cases |
| | "Schedule a recruiter chat" | Entice + CTA | Case 3 |

### Pill Variants by Sentiment (Case 3 Only)

| Sentiment | CTA Phrasing Strategy | Example Pills |
|-----------|----------------------|---------------|
| 😊 **Positive** | Strong conversion language | "Schedule a recruiter chat", "Start your application" |
| 😐 **Neutral** | Standard CTA | "Talk to a recruiter", "Get personalized guidance" |
| 😟 **Negative** | Softer, supportive language | "Have questions? Let's chat", "Explore your options" |

## 🎯 Notes on Business Goals

Business goals should only adjust **ranking and selection** within the 4-pill limit.

| Campaign Goal | Implementation | Example Pill |
|---------------|----------------|--------------|
| Recruiter contact | Include recruiter CTA as one Entice pill | "Talk to a recruiter" |
| Assessment completion | Include assessment CTA as one Entice pill | "Start the assessment" |
| Event registration | Include event CTA as one Entice pill | "Register for info session" |

⚠️ **Important:** Business goals do NOT increase pill count—they influence selection and ordering only.

---

## 🔬 Research Plan: Identifying the Right Segue Pills

To ensure pills are relevant, effective, and grounded in real user behavior, follow this **4-phase research strategy**.

### Phase 1: Mine Real Q&A Logs for Intent Clusters
**Timeline:** Days 1–2  
**Objective:** Understand what users actually ask

```
┌─────────────────┐
│ Chat Logs       │
│ (last 30 days)  │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Cluster into    │
│ 8-12 core       │
│ intents         │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Extract exact   │
│ user phrasing   │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Candidate Pill  │
│ Library (20-30) │
└─────────────────┘
```

**Actions:**
- Group questions into intents: eligibility, careers, benefits, training, CTA, etc.
- Extract **exact user phrasing** ("Am I eligible?" vs "Can I join if…")
- Create 3–5 pill variants per intent

**Deliverable:** Draft pill library (20–30 candidates)

---

### Phase 2: Run Label Fit Tests per Use Case
**Timeline:** Day 3  
**Objective:** Validate which pills resonate with target users

| Use Case | Test Group | Test Method | Sample Size |
|----------|-----------|-------------|-------------|
| Case 1 (Unknown) | New visitors | Show 2–3 pill sets; ask "Which 2 would you click first?" | 5–8 users |
| Case 2 (Some data) | Users with partial session data | Same | 5–8 users |
| Case 3 (Rich data) | Engaged/returning users | Same | 5–8 users |

**Metrics to Track:**
- ✓ Click intent (which pills they'd tap first)
- ✓ Perceived relevance (5-point scale)
- ✓ Clarity (do they understand what the pill does?)

**Deliverable:** Top-performing pills per use case (ranked list)

---

### Phase 3: In-Product A/B Testing
**Timeline:** Days 4–7  
**Objective:** Measure real performance

```
┌──────────────────┐
│ Live Traffic     │
│ (Split 50/50)    │
└────────┬─────────┘
         ↓
    ┌────┴────┐
    ↓         ↓
┌───────┐ ┌───────┐
│ Set A │ │ Set B │
│(Control)│(Variant)│
└───┬───┘ └───┬───┘
    ↓         ↓
┌─────────────────┐
│ Measure:        │
│ • CTR           │
│ • Completion    │
│ • Drop-off      │
└─────────────────┘
```

**Test Variants:**
- Control: current default pills (if exist) OR generic set
- Variant A: Top pills from Phase 2
- Variant B: Alternate ordering/phrasing

**Metrics:**
- **CTR** (click-through rate on pills)
- **Chat completion** (user reaches end of conversation)
- **CTA success** (user taps "Talk to a recruiter" or other goal)
- **Drop-off rate** (user abandons after first response)

**Deliverable:** Data-proven pill set + ordering per use case

---

### Phase 4: Scoring Framework for Ongoing Updates
**Timeline:** Ongoing (post-sprint)  
**Objective:** Continuously improve pills per campaign

**Pill Scoring Formula:**

```
Pill Score = (Relevance × 0.4) + (Predictability × 0.3) + (Business Impact × 0.3)

Where:
  Relevance       = % of users who clicked pill when shown
  Predictability  = % of similar sessions that led to this intent
  Business Impact = conversion rate to target CTA
```

**Refresh Cadence:**
- **Weekly:** Review pill performance by use case
- **Bi-weekly:** Test new pill variants
- **Per campaign:** Adjust business goal pills

**Deliverable:** Live pill performance dashboard + refresh process

---

### Quick Start Timeline (1 Sprint)

| Day | Activity | Owner | Output |
|-----|----------|-------|--------|
| **1–2** | Mine Q&A logs → cluster intents → draft pill library | Data/UX | 20–30 candidate pills |
| **3** | Run label fit tests (5–8 users per case) | UX Research | Top pills per case |
| **4** | Implement A/B test framework | Engineering | Test setup |
| **5–7** | Run A/B tests + collect data | Product | Performance data |
| **8** | Analyze results + finalize pill sets | Product/UX | Final pill library |

---

## 📦 Deliverable Alignment
This document defines the 3 AC use cases, the pill count, and the selection rules to guide:
- ✅ Requirements for the logic implementation
- ✅ Copy guidance for pill text
- ✅ Research plan to validate and refine pill labels

---

## 🚀 Tier Deployment Strategy

### Introduction

Given that we currently do not have high data quality levels available, we must deploy the segue pills system in a phased, tiered approach. This strategy allows us to launch with basic functionality (Case 1) and gradually evolve to sophisticated personalization (Case 3) as data collection and quality improve.

**Deployment Philosophy:** Start simple, measure, learn, and evolve.

### Current State Assessment

**Data Quality Level:** ⚫ NULL (Case 1)  
**Available Signals:** None  
**Confidence:** None  
**Deployment Tier:** Tier 1 (Generic Default)

### Tier Deployment Roadmap

```
┌─────────────────────────────────────────────────────────────────┐
│                    TIER DEPLOYMENT TIMELINE                    │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   TIER 1     │   →     │   TIER 2     │   →     │   TIER 3     │
│              │         │              │         │              │
│  Case 1 Only │         │  Cases 1+2   │         │ Cases 1+2+3  │
│  Generic     │         │  + Page Data │         │  + Full Data │
│  Default     │         │              │         │              │
│              │         │              │         │              │
│  Week 1-2    │         │  Week 3-4    │         │  Week 5+      │
│  Launch      │         │  Enhanced    │         │  Full System  │
└──────────────┘         └──────────────┘         └──────────────┘
```

### Tier 1: Generic Default Launch (Weeks 1-2)

**Objective:** Deploy basic segue pills functionality with safe, generic defaults.

**Implementation:**
- ✅ Deploy Case 1 logic only
- ✅ Use generic default pills (4 pills: 2 Anticipate + 2 Entice)
- ✅ No personalization based on user data
- ✅ All users receive the same pill set

**Pill Set:**
1. "What can you help me with?" [Anticipate]
2. "Explore careers" [Anticipate]
3. "Eligibility basics" [Entice]
4. "Talk to a recruiter" [Entice + CTA]

**Data Collection Focus:**
- Track pill click-through rates (CTR)
- Measure chat completion rates
- Monitor CTA conversion (recruiter contact)
- Collect user feedback on pill relevance

**Success Metrics:**
- Baseline CTR established
- System stability confirmed
- User acceptance validated

**Prerequisites:**
- ✅ Research Lab generates initial pill library
- ✅ Pill recommendation system operational
- ✅ Chatbot widget integrated with pills display
- ✅ Analytics tracking implemented

---

### Tier 2: Page-Based Personalization (Weeks 3-4)

**Objective:** Add page-based personalization when page URL and content are available.

**Implementation:**
- ✅ Enable Case 2 logic
- ✅ Detect page URL and extract page content
- ✅ Capture navigation/source/referral data
- ✅ Route users to Case 2 when page data available
- ✅ Fallback to Case 1 when no page data

**Data Requirements:**
- Page URL available in session
- Page content/topic extractable
- Navigation path trackable
- Referral source identifiable

**Pill Selection Logic:**
- Case 2: Page-based anticipate pills + adjacent entice pills
- Case 1: Generic defaults (fallback)

**Example Flow:**
```
User on /careers page
  ↓
System detects: page = "careers", topic = "career exploration"
  ↓
Case 2 Activated
  ↓
Pills Generated:
  1. "Compare career paths" [Anticipate - page-based]
  2. "See job requirements" [Anticipate - page-based]
  3. "Training overview" [Entice - adjacent]
  4. "Talk to a recruiter" [Entice + CTA]
```

**Data Collection Focus:**
- Compare Case 1 vs. Case 2 performance
- Measure relevance improvement
- Track page-to-pill mapping effectiveness
- Validate adjacent topic selection

**Success Metrics:**
- Case 2 CTR > Case 1 CTR (target: +20%)
- Higher perceived relevance scores
- Reduced drop-off rate
- Improved CTA conversion

**Prerequisites:**
- ✅ Page content extraction system operational
- ✅ Topic classification working
- ✅ Navigation tracking implemented
- ✅ Case 2 pill generation validated in Research Lab

---

### Tier 3: Full Personalization (Week 5+)

**Objective:** Deploy complete three-tier system with sentiment, engagement, and campaign goal integration.

**Implementation:**
- ✅ Enable Case 3 logic
- ✅ Integrate sentiment analysis
- ✅ Calculate engagement scores
- ✅ Link campaign goals to pill selection
- ✅ Sentiment-adjusted CTA phrasing

**Data Requirements:**
- All Tier 2 requirements +
- Sentiment score (positive/neutral/negative)
- Engagement score (time on site, pages viewed, interactions)
- Active campaign goals with CTA requirements
- User session history

**Pill Selection Logic:**
- Case 3: Behavior-driven anticipate + goal-aligned entice (when rich data available)
- Case 2: Page-based (when partial data available)
- Case 1: Generic defaults (when no data available)

**Example Flow:**
```
User with rich session data:
  - Page: /eligibility
  - Engagement: High (5+ pages, 3+ minutes)
  - Sentiment: Positive
  - Campaign Goal: Recruiter contact
  ↓
Case 3 Activated
  ↓
Pills Generated:
  1. "Check eligibility now" [Anticipate - behavior-driven]
  2. "Next steps to join" [Anticipate - behavior-driven]
  3. "Schedule a recruiter chat" [Entice + CTA - strong language, positive sentiment]
  4. "See training timeline" [Entice - adjacent]
```

**Data Collection Focus:**
- Compare all three cases performance
- Measure sentiment impact on CTA conversion
- Validate engagement score accuracy
- Track campaign goal effectiveness

**Success Metrics:**
- Case 3 CTR > Case 2 CTR > Case 1 CTR
- Sentiment-adjusted CTAs show higher conversion
- Engagement-based pills show better relevance
- Campaign goals successfully integrated

**Prerequisites:**
- ✅ Sentiment analysis system operational
- ✅ Engagement scoring algorithm implemented
- ✅ Campaign goal management system ready
- ✅ Case 3 pill generation validated in Research Lab

---

### Tier Progression Criteria

**Tier 1 → Tier 2:**
- ✅ Tier 1 stable for 2 weeks
- ✅ Baseline metrics established
- ✅ Page data collection infrastructure ready
- ✅ Case 2 pills generated and tested in Research Lab

**Tier 2 → Tier 3:**
- ✅ Tier 2 stable for 2 weeks
- ✅ Case 2 showing improvement over Case 1
- ✅ Sentiment analysis system operational
- ✅ Engagement scoring algorithm validated
- ✅ Campaign goal system integrated
- ✅ Case 3 pills generated and tested in Research Lab

### Risk Mitigation

**Tier 1 Risks:**
- Generic pills may feel irrelevant to some users
- **Mitigation:** Monitor feedback, iterate on default pill library

**Tier 2 Risks:**
- Page detection may fail or be inaccurate
- **Mitigation:** Robust fallback to Case 1, validate page classification

**Tier 3 Risks:**
- Sentiment/engagement scores may be inaccurate
- **Mitigation:** Start with conservative thresholds, validate against user behavior

### Rollback Strategy

Each tier can be rolled back independently:
- **Tier 3 → Tier 2:** Disable Case 3, fallback to Cases 1+2
- **Tier 2 → Tier 1:** Disable Case 2, fallback to Case 1 only
- **Tier 1 → Off:** Disable pills feature entirely

### Expected Timeline

| Week | Tier | Status | Focus |
|------|------|--------|-------|
| 1-2 | Tier 1 | Launch | Generic defaults, baseline metrics |
| 3-4 | Tier 2 | Enhanced | Page-based personalization |
| 5+ | Tier 3 | Full System | Complete three-tier personalization |

**Note:** Timeline may vary based on data collection speed and system validation results.

---

## 📋 Product Requirements Document (PRD)

### Overview

This PRD outlines the requirements for Content Operations and Technology teams to implement and maintain the segue pills system. It provides clear, actionable specifications for both teams to ensure successful deployment and ongoing optimization.

---

### Content Operations Requirements

#### 1. Pill Copy Management

**Requirement:** Content Ops must maintain a library of pill labels that are:
- **Simple and derivative** of real Q&A topics
- **Plain language** (no jargon or military-specific terms without context)
- **Action-oriented** (start with verbs: "Explore", "Check", "Compare", "See")
- **Character limit:** Maximum 25 characters per pill label

**Deliverables:**
- Initial pill library of 20-30 candidate pills across categories (Orientation, Careers, Eligibility, Benefits, Training, CTA)
- Pill variants by sentiment (positive, neutral, negative) for Case 3
- Regular updates based on performance data and user feedback

**Tools:**
- Access to Segue Pills Research Lab for generating and testing pill candidates
- Campaign Goal management interface for defining business CTAs

#### 2. Campaign Goal Definition

**Requirement:** Content Ops must define and maintain campaign goals that influence pill selection.

**Deliverables:**
- Campaign goal name and description
- Business prompt (guidelines for AI to generate goal-aligned pills)
- CTA requirements:
  - Required pill labels (mandatory pills that must appear)
  - Min/max count of CTA pills (typically 1-2)
  - Goal type (recruiter_contact, assessment_completion, event_registration, etc.)

**Process:**
- Create campaign goals in `/content/segue-pills/goals`
- Link campaign goals to research projects
- Activate/deactivate goals based on campaign timeline

#### 3. Q&A Project Integration

**Requirement:** Content Ops must link pill research projects to existing Q&A projects.

**Deliverables:**
- Select appropriate Q&A project when creating pill research
- Ensure Q&A project has sufficient questions/answers for pill generation context
- Maintain alignment between pill research and Q&A project updates

**Process:**
- When creating new pill research, select linked Q&A project
- System will use Q&A project questions for context in pill generation
- Chatbot widget will use linked Q&A project for answering user questions

#### 4. Testing & Validation

**Requirement:** Content Ops must test pill recommendations before production deployment.

**Deliverables:**
- Test pill sets for all three cases (Case 1, Case 2, Case 3)
- Validate pill relevance and clarity
- Provide feedback on pill performance
- Approve pill sets for production use

**Process:**
- Use Research Lab to generate pill recommendations
- Test pills in chatbot widget on `/content/segue-pills` page
- Review confidence scores and rationale
- Request adjustments if needed

---

### Technology Team Requirements

#### 1. Data Collection Infrastructure

**Requirement:** Tech team must implement data collection for all three cases.

**Tier 1 (Case 1) - Required:**
- ✅ No data collection needed (NULL data case)

**Tier 2 (Case 2) - Required:**
- ✅ Page URL capture (current page path)
- ✅ Page content extraction (topic classification)
- ✅ Navigation/source tracking (referral URL, entry point)
- ✅ Session context storage (temporary, per-session)

**Tier 3 (Case 3) - Required:**
- ✅ All Tier 2 requirements +
- ✅ Sentiment analysis (positive/neutral/negative score)
- ✅ Engagement score calculation:
  - Time on site
  - Pages viewed
  - Interactions (clicks, scrolls, form fills)
- ✅ Campaign goal detection (active goals for current session)
- ✅ User session history (if available)

**Technical Specifications:**
- Data must be available in real-time when user opens chatbot
- Data should be stored in session (not persisted unless user takes action)
- Fallback gracefully to lower tier if data unavailable

#### 2. API Endpoints

**Requirement:** Tech team must implement and maintain API endpoints for pill generation and retrieval.

**Required Endpoints:**

```
GET /api/segue-pills/researches
  - List all pill research projects
  - Filter by status, withPillsOnly flag
  - Include campaignGoal and qaProject relations

GET /api/segue-pills/researches/[researchId]
  - Get single research project details
  - Include all relations (campaignGoal, qaProject)

GET /api/segue-pills/researches/[researchId]/recommendations
  - Get pill recommendations for specific research
  - Query params: campaignGoalId, useCase (1, 2, or 3)
  - Returns: { case1: {...}, case2: {...}, case3: {...} }

GET /api/segue-pills/campaign-goals
  - List all campaign goals
  - Filter by isActive flag

POST /api/segue-pills/campaign-goals
  - Create new campaign goal
  - Body: { name, goalType, description, businessPrompt, ctaRequirement }
```

**Response Format:**
- All endpoints must return JSON
- Include error handling with appropriate HTTP status codes
- Support CORS for frontend access

#### 3. Chatbot Widget Integration

**Requirement:** Tech team must integrate segue pills into the existing `ProjectChatbot` component.

**Implementation Requirements:**
- Add research project dropdown selector
- Display pills when research project selected
- Show pills above chat input area
- Handle pill clicks (trigger chat message with pill label)
- Support all three use cases (Case 1, 2, 3)
- Implement use case detection logic:
  - Case 1: No data available
  - Case 2: Page data available
  - Case 3: Rich data (sentiment + engagement + campaign goals) available

**UI Requirements:**
- Pills displayed as clickable buttons/chips
- Maximum 4 pills shown at once
- Pills should be visually distinct from chat messages
- Responsive design (mobile-friendly)
- Loading states while fetching pills

**State Management:**
- Track selected research project ID
- Track selected campaign goal ID (optional)
- Track current use case (1, 2, or 3)
- Track pills shown to user (for analytics)
- Track pills clicked (for analytics)

#### 4. Pill Selection Logic

**Requirement:** Tech team must implement pill selection algorithm based on use case.

**Case 1 Logic:**
- Always return generic default pills
- No personalization
- Fixed set of 4 pills

**Case 2 Logic:**
- Extract page topic from URL/content
- Select 2 anticipate pills based on page topic
- Select 2 entice pills (adjacent topics + campaign goals)
- Apply diversity filter (pills must span ≥2 categories)
- Apply no-contradiction filter

**Case 3 Logic:**
- Use most engaged topic or most recent page
- Select 2 anticipate pills based on behavior
- Select 2 entice pills (business goal-aligned + adjacent)
- Adjust CTA phrasing based on sentiment:
  - Positive: Strong conversion language
  - Neutral: Standard CTA
  - Negative: Softer, supportive language
- Apply all filters (diversity, no-contradiction, CTA cap)

**Implementation Notes:**
- Use `lib/segue-pills/pill-recommender.ts` for recommendation logic
- Respect campaign goal requirements (required pills, min/max counts)
- Return confidence scores for each pill
- Log selection rationale for debugging

#### 5. Analytics & Tracking

**Requirement:** Tech team must implement analytics tracking for pill performance.

**Required Events:**
- `pill_shown`: When pills are displayed to user
  - Data: researchId, useCase, pillIds, pillLabels
- `pill_clicked`: When user clicks a pill
  - Data: researchId, useCase, pillId, pillLabel, clickOrder, timeToClick
- `chat_completed`: When user completes chat conversation
  - Data: researchId, useCase, pillsShown, pillsClicked
- `cta_reached`: When user reaches campaign goal CTA
  - Data: researchId, useCase, ctaType, pillsShown, pillsClicked

**Storage:**
- Store events in `SegueTestSession` table
- Aggregate data for performance dashboards
- Support A/B testing analysis

#### 6. Error Handling & Fallbacks

**Requirement:** Tech team must implement robust error handling and fallback logic.

**Error Scenarios:**
- Research project not found → Disable pills, show error message
- Recommendations not available → Fallback to Case 1 generic pills
- API failure → Gracefully degrade, show generic pills
- Data collection failure → Fallback to lower tier (Case 3 → Case 2 → Case 1)

**Fallback Chain:**
```
Case 3 (attempt) → Case 2 (fallback) → Case 1 (final fallback)
```

**User Experience:**
- Never show broken UI
- Always show at least generic pills (Case 1)
- Log errors for debugging
- Display user-friendly error messages if needed

#### 7. Performance Requirements

**Requirement:** Tech team must ensure system performance meets standards.

**Performance Targets:**
- Pill loading: < 500ms from user opening chatbot
- API response time: < 200ms for recommendations endpoint
- No impact on existing chatbot functionality
- Support concurrent users (no degradation)

**Optimization:**
- Cache pill recommendations when possible
- Lazy load pills (only fetch when research selected)
- Minimize database queries
- Use efficient data structures

---

### Acceptance Criteria

**Content Ops:**
- ✅ Pill library of 20-30 candidates created and maintained
- ✅ Campaign goals defined and linked to research projects
- ✅ Q&A projects linked to pill research projects
- ✅ Pills tested and approved for production

**Tech Team:**
- ✅ Data collection infrastructure implemented for all tiers
- ✅ API endpoints operational and tested
- ✅ Chatbot widget integrated with pills display
- ✅ Pill selection logic implemented for all three cases
- ✅ Analytics tracking functional
- ✅ Error handling and fallbacks working
- ✅ Performance targets met

---

### Dependencies

**Content Ops Dependencies:**
- Access to Segue Pills Research Lab
- Access to Campaign Goal management interface
- Access to Q&A project selection

**Tech Team Dependencies:**
- Prisma schema updated (SeguePillResearch, SegueCampaignGoal, SegueTestSession)
- OpenAI API access for pill generation
- Analytics infrastructure for tracking
- Session management system

---

### Timeline

**Phase 1 (Week 1-2):** Tier 1 Deployment
- Content Ops: Create initial pill library, define generic defaults
- Tech Team: Implement Case 1 logic, basic widget integration

**Phase 2 (Week 3-4):** Tier 2 Deployment
- Content Ops: Test page-based pills, provide feedback
- Tech Team: Implement Case 2 logic, page data collection

**Phase 3 (Week 5+):** Tier 3 Deployment
- Content Ops: Test full personalization, validate campaign goals
- Tech Team: Implement Case 3 logic, sentiment/engagement integration

---

## 📦 Deliverable Alignment
This document defines the 3 AC use cases, the pill count, and the selection rules to guide:
- ✅ Requirements for the logic implementation
- ✅ Copy guidance for pill text
- ✅ Research plan to validate and refine pill labels
- ✅ Tier deployment strategy for gradual rollout
- ✅ Product Requirements Document for Content Ops and Tech teams

