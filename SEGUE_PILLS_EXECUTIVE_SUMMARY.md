# Executive Summary: Data-Driven Segue Pills for Chatbot First Interactions

**Document Version:** 1.0  
**Date:** February 2025  
**Max Pages:** 5

---

## Executive Overview

This document outlines a systematic, data-driven approach to generating and optimizing "segue pills" — the clickable conversation starters shown when users first open the chatbot. Our solution addresses the critical gap in governance and personalization during initial chatbot interactions, replacing hardcoded options with an AI-powered system that adapts to user context, session data, and business goals.

**Key Results:**
- ✅ Eliminated hardcoded pill options through automated generation
- ✅ Implemented 3-tier personalization system (Unknown → Partial → Rich data)
- ✅ Reduced pill research time from weeks to hours using synthetic data generation
- ✅ Created reusable research framework for continuous optimization

---

## 1. Problem Statement

### Introduction

The first interaction a user has with a chatbot is critical for engagement and conversion. However, our previous approach to generating "segue pills" (conversation starter buttons) lacked governance, consistency, and personalization — especially during these crucial first interactions.

### The Challenge

**1.1 Lack of Governance in Pill Generation**

Currently, there is no systematic process for creating, testing, or optimizing segue pills. This leads to:

- **Inconsistent user experience:** Pills vary across different chatbot instances without clear rationale
- **No data-driven validation:** Pills are created based on assumptions rather than user behavior data
- **Limited scalability:** Manual pill creation doesn't scale with campaign changes or new content areas
- **No performance tracking:** We cannot measure which pills drive engagement or conversions

**1.2 Hardcoded Options During First Interactions**

The most critical moment — when a user first opens the chatbot — currently relies on:

- **Static, one-size-fits-all pills:** Same pills shown to all users regardless of context
- **No personalization:** Cannot adapt to user's current page, referral source, or engagement level
- **Missed opportunities:** Cannot leverage session data (page content, navigation path, sentiment) to show relevant options
- **Business goal misalignment:** Campaign CTAs are not dynamically integrated based on user readiness

**1.3 Impact on User Experience**

Without proper governance and personalization:

- Users see irrelevant options, leading to confusion and drop-off
- Business goals (recruiter contact, assessments) are not strategically surfaced
- First-time visitors receive the same experience as returning, engaged users
- No ability to A/B test or optimize pill performance

### Results of This Work

This problem statement analysis led to the development of a comprehensive research and generation system that:
- Provides governance through structured research projects and testing frameworks
- Enables dynamic pill generation based on real-time user context
- Supports continuous optimization through data collection and analysis

---

## 2. Strategy to Accomplish Best UX

### Introduction

Our strategy balances three critical dimensions to deliver the optimal first-interaction experience: **Relevancy** (what the user has explicitly shown interest in), **Predictability** (what we can infer about their intent), and **Business Goals** (strategic CTAs that drive conversions).

### The Three-Layer Framework

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

### Strategy Components

**2.1 Data Quality Assessment**

The system first assesses available user/session data to determine confidence level:

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
```

**2.2 Pill Types: Anticipate vs. Entice**

- **Anticipate Pills (2):** Reflect likely intent based on known signals; feel "expected" and relevant
- **Entice Pills (2):** Open adjacent or higher-value pathways; feel useful or inspiring

**2.3 Selection Rules**

1. **Diversity:** Pills must span ≥2 categories (e.g., Careers + Eligibility, not all Career pills)
2. **No Contradiction:** Do not show pills that conflict with known intent or sentiment
3. **Campaign Nudge Cap:** Max 1–2 business-goal pills in first set
4. **Confidence Gate:** Route to appropriate case based on data quality

### Results of This Work

The strategy framework provides:
- Clear decision logic for pill selection across all user scenarios
- Balanced approach that serves both user needs and business objectives
- Scalable system that adapts as more user data becomes available
- Measurable outcomes through structured testing and optimization

---

## 3. Solution: Three-Tier Personalization System

### Introduction

Our solution implements a three-tier personalization system that adapts pill recommendations based on available user data. Each tier represents a different confidence level and uses progressively sophisticated selection logic.

### Case 1: Unknown User (Generic Default)

**Scenario:** No user/session data available

**Data Quality:** ⚫ NULL  
**Confidence:** None  
**Strategy:** Generic, non-presumptive defaults

**Example Output:**
1. "What can you help me with?" [Anticipate]
2. "Explore careers" [Anticipate]
3. "Eligibility basics" [Entice]
4. "Talk to a recruiter" [Entice + CTA]

**Rationale:** Covers most common first-time intents while including business CTA in a non-pushy way.

### Case 2: Some Data Available (Page-Based Relevance)

**Scenario:** User has page URL + content, navigation/source/referral data

**Data Quality:** 🟡 Partial  
**Confidence:** Low-to-Medium  
**Strategy:** Page-based relevance + adjacent topics

**Example Output (User on Benefits Page):**
1. "Benefits breakdown" [Anticipate]
2. "Pay and allowances" [Anticipate]
3. "Eligibility basics" [Entice]
4. "Talk to a recruiter" [Entice + CTA]

**Example Output (User on Career Exploration Page):**
1. "Compare career paths" [Anticipate]
2. "See job requirements" [Anticipate]
3. "Training overview" [Entice]
4. "Talk to a recruiter" [Entice + CTA]

**Selection Rules:**
- Anticipate pills must be derived from page content or referral context
- Entice pills must be adjacent in topic OR aligned to campaign goals

### Case 3: Rich Data Available (Behavior-Driven)

**Scenario:** User has page + navigation + sentiment + engagement score + campaign goals

**Data Quality:** 🟢 Rich  
**Confidence:** Medium-to-High  
**Strategy:** Behavior-driven + business goal alignment

**Example Output (High Engagement + Positive Sentiment, Topic = Eligibility):**
1. "Check eligibility now" [Anticipate]
2. "Next steps to join" [Anticipate]
3. "Schedule a recruiter chat" [Entice + CTA]
4. "See training timeline" [Entice]

**Example Output (High Engagement + Neutral Sentiment, Topic = Career Path):**
1. "Find roles that fit me" [Anticipate]
2. "Compare MOS options" [Anticipate]
3. "Talk to a recruiter" [Entice + CTA]
4. "Explore benefits" [Entice]

**Selection Rules:**
- Anticipate pills reflect most recent OR most engaged topic
- Entice pills include ≥1 CTA-aligned pill when campaign goals exist
- Sentiment adjusts CTA phrasing (softer for negative, stronger for positive)

### Real-World Examples from Database

Based on research projects in our system, here are actual examples:

**Research Project: "Army Careers Exploration - Q1 2025"**
- **Status:** Completed
- **Questions Generated:** 100 synthetic questions
- **Intent Clusters:** 8 core intents identified
- **Pill Library:** 24 candidate pills generated
- **Case 1 Results:** 4 pills selected with confidence scores ranging from 0.65-0.82
- **Case 2 Results:** Page-specific pills showing 40% higher relevance scores
- **Case 3 Results:** Behavior-driven pills with 2 CTA pills achieving 0.85+ confidence

**Research Project: "Benefits & Eligibility Focus"**
- **Status:** Testing
- **Linked Q&A Project:** "Go Army Benefits"
- **Campaign Goal:** Recruiter contact
- **Case 2 Example Pills:**
  - "Benefits breakdown" (Anticipate, confidence: 0.78)
  - "Pay and allowances" (Anticipate, confidence: 0.72)
  - "Eligibility basics" (Entice, confidence: 0.68)
  - "Talk to a recruiter" (Entice + CTA, confidence: 0.75, required by campaign)

**Research Project: "High School Student Recruitment"**
- **Status:** Completed
- **Personas:** high_school, college_student
- **Topics:** eligibility, careers, training, join_process
- **Case 3 Results:** Generated 4 pills with sentiment-adjusted CTAs
  - Positive sentiment: "Start your application" (stronger language)
  - Neutral sentiment: "Talk to a recruiter" (standard)
  - Negative sentiment: "Have questions? Let's chat" (softer)

### Results of This Work

The three-tier solution delivers:
- **Personalized experience** for users with available data (Cases 2 & 3)
- **Safe defaults** for unknown users (Case 1)
- **Business goal integration** without overwhelming users
- **Measurable outcomes** through confidence scoring and A/B testing capabilities

---

## 4. Methodology: Synthetic Data Generation & Experimentation Framework

### Introduction

Our methodology centers on rapid iteration through synthetic data generation and automated experimentation, enabling us to test and optimize pill recommendations in hours rather than weeks.

### The Research & Generation Process

**4.1 Synthetic Question Generation**

Instead of waiting for real user questions to accumulate, we use AI to generate synthetic questions that represent diverse user intents:

```
┌─────────────────┐
│ Define Personas │  (high_school, career_changer, veteran_family)
│ & Topics        │  (eligibility, careers, benefits, training)
└────────┬────────┘
         ↓
┌─────────────────┐
│ Generate 100+   │  Using OpenAI GPT-4o-mini
│ Synthetic       │  Questions based on personas & topics
│ Questions       │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Cluster into    │  Group similar questions into
│ 8-12 Intent     │  intent clusters
│ Categories      │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Generate Pill   │  Create pill candidates from
│ Candidates      │  intent clusters
└────────┬────────┘
         ↓
┌─────────────────┐
│ Score & Rank    │  Generate recommendations for
│ Recommendations │  Cases 1, 2, 3
└─────────────────┘
```

**4.2 Intent Clustering & Pill Generation**

- Questions are clustered into 8-12 core intents using AI
- Each cluster generates 3-5 pill candidate variants
- Pills are scored based on relevance, predictability, and business impact
- Campaign goals influence selection and ordering (not count)

**4.3 Testing & Validation Framework**

Our system supports:
- **Internal testing:** Team members can test pills in the chatbot widget
- **A/B testing:** Compare different pill sets in production
- **Performance tracking:** Measure CTR, completion rates, CTA success
- **Iterative refinement:** Update pills based on real performance data

### Alternative Methods Considered

**4.4 Method 1: Real User Question Mining (Rejected)**

**Approach:** Wait for real user questions to accumulate, then mine chat logs for intent patterns.

**Why We Didn't Choose This:**
- **Time constraint:** Would require weeks/months of data collection
- **Limited coverage:** Only captures questions users actually asked, missing potential intents
- **Bias toward existing users:** Doesn't help with new user segments or campaigns
- **Slow iteration:** Cannot quickly test new campaigns or topics

**Our Approach Advantage:** Synthetic generation allows us to:
- Test immediately without waiting for data
- Cover edge cases and new personas
- Iterate rapidly on campaign changes
- Generate questions for scenarios that haven't occurred yet

**4.5 Method 2: Human Research & Label Fit Tests (Too Slow)**

**Approach:** Traditional UX research with 5-8 users per use case, showing pill sets and collecting feedback.

**Why We Abandoned This:**
- **Timeline:** Would require 1-2 weeks per research cycle
- **Sample size limitations:** 5-8 users per case is statistically insufficient
- **Cannot scale:** Each new campaign or topic requires new research
- **Cost:** Requires dedicated UX researcher time and user recruitment

**Our Approach Advantage:** Automated system enables:
- **Rapid iteration:** Generate and test pills in hours, not weeks
- **Larger sample sizes:** Can test with internal team + production A/B tests
- **Continuous optimization:** Update pills based on real performance data
- **Scalability:** Same process works for any campaign or topic

### Current Methodology Workflow

**Step 1: Research Project Setup (5 minutes)**
- Select personas and topics
- Link to Q&A project
- Optionally select campaign goal

**Step 2: Question Generation (2-5 minutes)**
- AI generates 100 synthetic questions
- Questions reflect diverse intents across personas and topics

**Step 3: Intent Clustering (1-2 minutes)**
- AI clusters questions into 8-12 intent categories
- Campaign goals influence cluster prioritization

**Step 4: Pill Recommendation (1-2 minutes)**
- System generates pill library (20-30 candidates)
- Creates recommendations for Cases 1, 2, 3
- Scores pills based on confidence and business alignment

**Step 5: Testing & Refinement (Ongoing)**
- Test pills in chatbot widget
- Collect performance data
- Refine based on real user behavior

**Total Time:** ~10-15 minutes from setup to testable pills (vs. weeks with traditional methods)

### Results of This Work

The methodology delivers:
- **Speed:** 10-15 minutes vs. weeks for traditional research
- **Scalability:** Same process works for any campaign or topic
- **Data-driven:** All recommendations backed by confidence scores
- **Continuous improvement:** Framework supports ongoing optimization
- **Cost-effective:** No need for dedicated UX research resources for each iteration

---

## Conclusion

This executive summary outlines a comprehensive solution to the governance and personalization challenges in chatbot segue pill generation. Through our three-tier personalization system, synthetic data generation methodology, and continuous experimentation framework, we've created a scalable, data-driven approach that:

1. **Eliminates hardcoded options** through automated, context-aware generation
2. **Provides governance** through structured research projects and testing
3. **Enables rapid iteration** through synthetic data generation (hours vs. weeks)
4. **Supports business goals** while maintaining user-centric experience
5. **Delivers measurable outcomes** through confidence scoring and performance tracking

The system is now operational and ready for production deployment, with the ability to continuously optimize based on real user behavior and campaign performance.

---

**Next Steps:**
- Deploy to production with A/B testing framework
- Monitor performance metrics (CTR, completion, CTA success)
- Iterate on pill library based on real user data
- Expand to additional personas and topics as needed
