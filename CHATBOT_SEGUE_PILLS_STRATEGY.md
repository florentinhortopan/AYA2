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

