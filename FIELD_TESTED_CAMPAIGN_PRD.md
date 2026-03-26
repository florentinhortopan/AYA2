# Field Tested Campaign Experience PRD

## 1) Document Control
- Product: `Field Tested` campaign page + interactive journey
- Type: PRD / creative-technical brief
- Status: Draft for feasibility review
- Date: 2026-03-09
- Owners: Product, Creative Strategy, Content Systems, Engineering
- Inputs:
  - `FIELD_CONTEXT_FINDINGS.md` (full ordered intake from deck images)
  - Existing immersive chat/canvas system and content tooling in this repo
  - Existing GoArmy scraped + ingested content (`305` pages, `131` media image rows, Q&A corpus/project data)

---

## 2) Executive Summary

Build a high-impact campaign destination that translates `Field Tested` from a static message into a personalized, explorable, and credible journey for Tier 2 prospects, while still supporting parent/influencer audiences.

The experience should:
- Lead with `Unlock the warrior within`
- Let users self-identify and choose a journey
- Reveal content progressively through interaction
- Blend real-world media, practical detail, and AI assistance
- End in confidence-building CTAs with captured profile context

This product should reuse and orchestrate existing assets in the codebase (chat, canvas, Q&A, content cards, scraped image/media knowledge sources) rather than requiring full net-new infrastructure.

---

## 3) Background & Problem

From `Field Tested` findings:
- Prospects are interested but cautious; they need proof and concrete pathways.
- `Field Tested` concept resonates, but phrase/context is not always self-explanatory.
- Biggest positives: transferable skills, real stories, non-combat pathways, tangible benefits.
- Biggest blockers: autonomy/safety concerns, perceived intimidation, lack of practical specifics.
- Ecosystem risk: concept fragmentation across channels and inconsistent framing.

Current opportunity:
- We already have immersive architecture and campaign content systems.
- We now have a larger GoArmy knowledge/media dataset available for retrieval.
- We can ship a sophisticated MVP by combining existing modules with campaign-specific orchestration and UX.

---

## 4) Vision

Create a campaign page that feels like stepping into the field: emotionally real, interactive, and personally relevant. Every user should leave with:
- A clearer sense of fit (`this can be for me`)
- A practical map of what comes next
- A profile-based path they can continue/share

---

## 5) Product Goals

### Primary goals
1. Increase mid-funnel trust and self-belief among Tier 2 prospects.
2. Convert abstract campaign narrative into practical confidence.
3. Personalize journey by audience lens + user interaction.
4. Reuse existing content/data systems and assets at scale.

### Secondary goals
1. Improve parent/influencer support confidence.
2. Build a reusable campaign framework for future themes.
3. Establish measurable interaction signals for ongoing optimization.

### Non-goals (Phase 1)
- Full custom CMS authoring suite for all modules.
- Heavy 3D/WebGL dependence for core flow.
- New standalone mobile app.

---

## 6) Target Audiences

## 6.1 Tier 2 prospects (primary)
- Ages 18–28
- Concerned about uncertainty, fit, control, and long-term outcomes
- Motivated by practical growth, benefits, and relatable real stories

## 6.2 Tier 1 prospects (secondary)
- More aware/connected in some cases
- Respond to inclusive framing and practical pathway detail

## 6.3 Parents (listening + influence layer)
- Value support, direction, transferable skills, safety clarity
- Need reassurance and practical details

## 6.4 Influencers (ecosystem amplifier)
- Need authentic, modern, non-overhyped narratives
- High sensitivity to tone and representational realism

---

## 7) Positioning & Messaging Architecture

## Core proposition
`The Army doesn’t need you to show up ready. It makes you ready.`

## Hero message
`Unlock the warrior within.`

## Translation model
Map Warrior Ethos into user-native language:
- Strength -> confidence, resilience, determination
- Skills -> practical, transferable career pathways
- Support -> belonging, mentorship, team
- Stability -> benefits, structure, future readiness

## Tone principles
- Embedded realism (raw, credible, current)
- Respectful and direct (no patronizing simplification)
- Tangible and specific (not abstract aspiration)
- Inclusive and representative

---

## 8) Experience Strategy

The page should work as both:
1. A standalone campaign destination
2. A modular node in a broader acquisition ecosystem

## 8.1 Core experience pattern
- Progressive reveal
- Choice-driven branching
- Rich media + practical explainers
- AI micro-moments
- End-of-journey recap + CTA

## 8.2 Proposed IA (single-page app shell with section states)
1. **Hero / Instigation**
2. **Choose Your Lens** (Prospect / Parent / Influencer)
3. **Warrior Wheel Entry** (Strength / Skills / Support / Stability)
4. **Field Stories Gallery** (real story cards)
5. **Reality Check** (practical specifics: qualifications/process/benefits)
6. **My Path Builder** (interactive profile + fit signals)
7. **AI Copilot Moment** (question answering and recommendation refinement)
8. **Your Warrior Journey Recap** (achievements/summary)
9. **Action Lane** (Talk to recruiter / Explore roles / Save-share profile)

---

## 9) Interaction Design (Creative + System)

## 9.1 Interaction model
- **Explicit path selection:** user chooses audience lens and priorities early.
- **Progressive reveal gates:** each section unlocks based on interaction, not scroll-only.
- **Micro-assessments:** short side-by-side choices (2-4 option moments) update profile vector.
- **Contextual content injection:** media and cards update dynamically by profile + selected attribute.
- **AI in context:** small Q&A modules in sections, not one monolithic chatbot first.

## 9.2 Signature interactions (recommended)

### A) Warrior Wheel Navigator (core)
- Interactive wheel with four quadrants.
- Hover/tap reveals:
  - real story clip/image
  - practical proof point
  - role pathway example
  - relevant benefits/support detail

### B) “Field Reality” Story Stack
- Tinder-like or card-stack sequencing of real-world snippets:
  - operation moments
  - human moments
  - environmental moments
- User labels each as:
  - “I want this”
  - “Need more detail”
  - “Not for me yet”
- System updates profile confidence score and next recommendations.

### C) Confidence Friction Resolver
- User selects top concern:
  - autonomy
  - safety
  - qualification fit
  - timeline/process
- Experience surfaces specific cards/Q&A responses and reduces uncertainty score.

### D) Path Simulation
- Lightweight branching scenarios:
  - “Where do you start?”
  - “What skills do you want to build?”
  - “What support do you need most?”
- Outputs practical path summary and related role categories.

### E) Shareable Profile Snapshot
- End-state generated summary:
  - selected lens
  - top attributes
  - top interest areas
  - next 3 actions
- Save/share link for re-entry and referral.

## 9.3 Accessibility + interaction constraints
- All critical interactions keyboard-operable.
- No required audio/video playback for comprehension.
- Alternatives for motion-heavy modules.

---

## 10) Personalization & Decisioning

## 10.1 Profile vector (runtime)
- `audience_lens`: prospect|parent|influencer
- `top_attribute`: strength|skills|support|stability
- `confidence_score`: 0-100
- `concern_flags`: autonomy|safety|fit|timeline|benefits
- `content_affinity`: story|practical|benefits|non_combat|team

## 10.2 Inputs
- User interactions (selections, dwell, card clicks, AI questions)
- Existing Q&A matching signals
- Available knowledge/media metadata (`topicHints`, `section`, `slug`)

## 10.3 Output decisions
- Section ordering adjustments
- Card ranking and diversity caps
- Suggested follow-up prompts/pills
- CTA emphasis (which action to surface first)

---

## 11) Content & Asset Plan (What We Already Have vs Need)

## 11.1 Available now (high leverage)
- **Ingested GoArmy knowledge source pages:** `305`
- **Knowledge media rows:** `131` image assets currently available
- **Q&A project infrastructure:** existing `QaProject`, `QaQuestion`, `QaAnswer`
- **Immersive card framework:** supports `image`, `table`, `video`, `insight`, etc.
- **Scene orchestration + ranking infrastructure:** already implemented
- **Voice controls + chat overlay components:** available

## 11.2 Reusable systems in repo
- `app/api/content-tool/projects/[projectId]/immersive-chat/route.ts`
- `lib/content/immersive/data-adapters.ts`
- `lib/content/immersive/scene-orchestrator.ts`
- `components/content/immersive/scene-canvas.tsx`
- `components/content/project-chatbot.tsx`
- Content models in Prisma (knowledge/media + Q&A stack)

## 11.3 Gaps to close
1. Video inventory depth (currently images dominate; videos sparse in DB rows).
2. Campaign-specific metadata tags for `Field Tested` taxonomy:
   - operations / humans / field
   - strength / skills / support / stability
3. Structured profile persistence model for shareable snapshots.
4. Curated “reality check” factual modules with explicit qualification/process details.
5. Additional representation-diverse story assets.

---

## 12) Functional Requirements

## 12.1 Core page
- Must render campaign narrative modules with dynamic state transitions.
- Must allow user to choose audience lens and update content accordingly.
- Must provide interactive Warrior Wheel module.
- Must support progressive reveal based on user inputs.

## 12.2 AI/Chat
- Must keep conversational responses grounded in approved Q&A.
- Must allow contextual section-level question asks.
- Must output linked content cards to canvas/panel.

## 12.3 Content retrieval
- Must query and rank media by relevance + diversity.
- Must prioritize campaign-tagged assets when available.
- Must support fallback to broader project/global knowledge assets.

## 12.4 Profile + recap
- Must compute profile summary from interactions.
- Must generate recap section with “achievements” and next actions.
- Must support save/share state link.

## 12.5 Analytics
- Must track stage transitions, section completion, interaction selections, concern resolution, CTA clicks, and drop-off points.

---

## 13) Non-Functional Requirements

- Performance:
  - LCP under 2.8s on core campaign route target
  - lazy-load heavy media and interactive modules
- Accessibility:
  - WCAG AA baseline
- Reliability:
  - graceful fallback when AI endpoints fail
- Privacy:
  - no sensitive personal data required for path builder

---

## 14) Technical Architecture Proposal

## 14.1 Frontend
- New route: `app/campaigns/field-tested/page.tsx` (or project-scoped variant)
- Component architecture:
  - `FieldTestedHero`
  - `LensSelector`
  - `WarriorWheelInteractive`
  - `FieldStoryStack`
  - `RealityCheckModule`
  - `PathBuilder`
  - `SectionCopilot`
  - `JourneyRecap`
  - `ActionLane`

## 14.2 Backend/API
- Extend existing immersive route patterns with campaign-specific mode:
  - `mode: "field_tested"`
- New optional endpoint for profile state persistence:
  - `POST /api/campaigns/field-tested/profile`
  - `GET /api/campaigns/field-tested/profile/[id]`

## 14.3 Data layer
- Continue using:
  - `KnowledgeSourcePage`
  - `KnowledgeSourceMedia`
  - `QaQuestion` / `QaAnswer`
- Add metadata conventions in `KnowledgeSourceMedia.data`:
  - `campaign: "field_tested"`
  - `pillar: strength|skills|support|stability`
  - `bucket: operations|humans|field`
  - `audience_lens_fit: prospect|parent|influencer|all`

## 14.4 Ranking logic enhancements
- Existing relevance + diversity logic extended with:
  - pillar match boost
  - concern resolution boost
  - audience-lens match boost
  - freshness/time-campaign boost

---

## 15) Content Operations Plan

## 15.1 Authoring workflow
1. Curate campaign modules from `FIELD_CONTEXT_FINDINGS.md`.
2. Map each module to one of 4 attributes + 3 media buckets.
3. Attach approved Q&A responses to each module.
4. QA for:
   - respect/tone
   - practical detail completeness
   - representational balance

## 15.2 Suggested initial content pack
- 8-12 hero narrative blocks
- 24-36 media cards
- 20+ practical FAQ entries
- 12 recap templates (by lens + top concern)

---

## 16) Measurement Plan (KPIs + Instrumentation)

## 16.1 Primary KPIs
- Section completion rate (per funnel stage module)
- Concern-to-confidence conversion (before/after self-report interaction)
- CTA conversion rate (recruiter contact, role exploration)
- Return/share rate via saved profile links

## 16.2 Secondary KPIs
- AI assist engagement and satisfaction proxy
- Attribute distribution across users
- Time to first meaningful interaction
- Drop-off hotspots by module

## 16.3 Event schema (examples)
- `field_lens_selected`
- `warrior_attribute_selected`
- `concern_flag_selected`
- `field_story_interaction`
- `ai_micro_moment_opened`
- `ai_question_submitted`
- `journey_recap_viewed`
- `profile_saved`
- `profile_shared`
- `cta_clicked`

---

## 17) Experimentation Plan

## A/B themes
1. Hero framing:
   - A: Instigation-first
   - B: Benefit-first
2. Wheel entry order:
   - A: user chooses first
   - B: suggested best-fit first
3. AI placement:
   - A: early inline
   - B: after first two interactions
4. CTA strategy:
   - A: single primary CTA
   - B: tiered CTA stack (recruiter, roles, save-share)

---

## 18) Feasibility & Phasing

## Phase 0: Foundations (1-2 weeks)
- Campaign route skeleton
- Lens selection + static modules
- Reuse existing immersive cards and Q&A grounding
- Instrument base analytics

## Phase 1: Interactive Core (2-4 weeks)
- Warrior Wheel interactive
- Progressive reveal engine
- Concern resolver + practical detail modules
- Recap generation and CTA lane

## Phase 2: Personalization at Scale (3-5 weeks)
- Profile persistence and share links
- Advanced ranking personalization
- Richer campaign tagging and media ingestion enrichments
- Optimization experiments

## Phase 3: Ecosystem Extensions (later)
- Cross-channel continuity tokens
- Dynamic campaign evolution hooks (time-variant modules)
- Broader partner/influencer activation tooling

---

## 19) Risks & Mitigations

1. **Risk:** Overly cinematic feel undermines authenticity  
   **Mitigation:** enforce embedded-realism content rules; prioritize raw story artifacts.

2. **Risk:** Ambiguous messaging (“Field Tested” misunderstood)  
   **Mitigation:** explicit translation modules early in journey.

3. **Risk:** Intimidation/fear response from physicality-heavy media  
   **Mitigation:** balance with support/stability/non-combat pathways and practical explainers.

4. **Risk:** Incomplete practical detail reduces conversion  
   **Mitigation:** dedicated reality-check modules + Q&A grounding + qualification explainers.

5. **Risk:** Ecosystem incoherence across modules/channels  
   **Mitigation:** shared taxonomy + centralized module definitions + analytics-based drift monitoring.

---

## 20) Build Readiness Checklist

- [ ] Confirm route strategy (`/campaigns/field-tested` vs project-scoped variant)
- [ ] Approve IA and interaction map
- [ ] Approve metadata tagging schema
- [ ] Confirm media curation set for v1
- [ ] Confirm Q&A pack for practical concerns
- [ ] Confirm analytics event contract
- [ ] Confirm legal/compliance review for claims and testimonials

---

## 21) Immediate Next Build Tasks (Proposed)

1. Create campaign page shell + section scaffolding.
2. Wire lens selector and runtime profile state.
3. Adapt existing immersive card retrieval for `field_tested` mode.
4. Build Warrior Wheel interactive component with dynamic card feed.
5. Implement concern resolver panel with Q&A-grounded responses.
6. Add recap generator and action lane.
7. Instrument analytics and run internal dogfood tests.
8. Run feasibility review against design/engineering bandwidth and content readiness.

---

## 22) Appendix: Existing Project Asset Snapshot

- GoArmy crawl latest:
  - `crawledPageCount`: 305
  - `crawlStats.htmlPages`: 52
  - `crawlStats.cmtJobs`: 263
- DB verification snapshot:
  - `KnowledgeSourcePage`: 305 (GoArmy project)
  - `KnowledgeSourceMedia`: 131 images (videos currently limited/none)
- Core reusable runtime:
  - immersive chat + canvas orchestration
  - media ranking and diversity caps
  - Q&A-grounded assistant reply model

This supports a robust Phase 0/1 implementation without waiting for major new infrastructure.

---

## 23) Build-Ready Section Blueprint (Asset + Behavior Spec)

This section is the implementation-grade blueprint for each campaign section.

### Status key
- `HAVE` = available now in project/DB
- `PARTIAL` = available but needs curation/tagging/augmentation
- `MISSING` = not currently available; must produce

### 23.1 Section-by-section spec

## Section S1: Hero / Instigation
- **Component ID:** `ft-hero-instigation`
- **UI Component:** `FieldTestedHero`
- **Primary job:** Convert "Army feels risky" to "I can become ready."
- **Core copy anchor:** `Unlock the warrior within`
- **Behavior:**
  - On load: show short headline + 1 subline + 2 CTAs (`Start your journey`, `See real stories`)
  - Parallax-lite background (no blocking autoplay)
  - If user previously has profile: show `Continue your path` chip
  - Scroll or CTA click marks section complete
- **Events:**
  - `ft_hero_viewed`
  - `ft_hero_primary_cta_clicked`
  - `ft_hero_secondary_cta_clicked`
- **Desired assets:**
  - Hero still/loop showing embedded realism field context (`PARTIAL`)
  - 1 concise manifesto excerpt (`HAVE`, from findings content)
  - Optional 6-12s silent cutdown (`MISSING` for this specific campaign page)
- **Best source candidates right now:**
  - Existing GoArmy hero/carousel images from `KnowledgeSourceMedia` (`HAVE`)
  - Future field-tested production cutdowns (`MISSING`)

## Section S2: Choose Your Lens
- **Component ID:** `ft-lens-selector`
- **UI Component:** `LensSelector`
- **Primary job:** Personalize frame to Prospect / Parent / Influencer.
- **Behavior:**
  - Three cards with short "what you’ll get" preview
  - One must be selected to unlock S3
  - Selection updates runtime profile + all downstream copy priorities
- **Events:**
  - `ft_lens_option_viewed`
  - `ft_lens_selected`
- **Desired assets:**
  - Persona card visuals (diverse humans, not stock-generic) (`PARTIAL`)
  - Lens-specific reassurance copy from findings (`HAVE`)
- **Best source candidates:**
  - Findings slides `IMG_3131-3142` for voice-of-audience themes (`HAVE`)
  - Additional portrait assets balanced by gender/ethnicity (`PARTIAL`)

## Section S3: Warrior Wheel Entry
- **Component ID:** `ft-warrior-wheel`
- **UI Component:** `WarriorWheelInteractive`
- **Primary job:** Let user choose value pillar and instantly see proof.
- **Behavior:**
  - Interactive wheel (Strength, Skills, Support, Stability)
  - Hover/focus/tap on segment opens side panel:
    - why this matters
    - 1 real story asset
    - 1 practical proof point
    - 1 suggested next action
  - First segment click sets `top_attribute`
  - Require 1 interaction before moving forward
- **Events:**
  - `ft_wheel_viewed`
  - `ft_wheel_segment_hovered`
  - `ft_wheel_segment_selected`
- **Desired assets by segment:**
  - Strength: transformation/challenge assets (`PARTIAL`)
  - Skills: non-combat role pathways (`PARTIAL`)
  - Support: team/camaraderie narratives (`PARTIAL`)
  - Stability: benefits/future foundation visuals (`PARTIAL`)
- **Best source candidates:**
  - `FIELD_CONTEXT_FINDINGS.md` sections from `IMG_3094`, `IMG_3122`, `IMG_3125` (`HAVE`)
  - Media rows tagged by pillar (needs metadata backfill) (`PARTIAL`)

## Section S4: Field Stories Gallery
- **Component ID:** `ft-story-stack`
- **UI Component:** `FieldStoryStack`
- **Primary job:** Increase authenticity and personal relevance.
- **Behavior:**
  - Card stack with 3 content buckets:
    - operations
    - humans
    - field
  - User response chips per card:
    - `I want this`
    - `Need details`
    - `Not for me yet`
  - Response updates `content_affinity` and concern model
  - At least 5 cards before section complete
- **Events:**
  - `ft_story_card_viewed`
  - `ft_story_response_selected`
  - `ft_story_section_completed`
- **Desired assets:**
  - 24-36 media cards with short captions (`PARTIAL`)
  - At least 8 per bucket for diversity (`MISSING` fully curated set)
  - 4-8 short video snippets preferred (`MISSING` currently)
- **Best source candidates:**
  - Current `KnowledgeSourceMedia` images (`HAVE`)
  - Campaign production library from "Operations/Humans/Field" taxonomy (`MISSING`)

## Section S5: Reality Check (Practical Details)
- **Component ID:** `ft-reality-check`
- **UI Component:** `RealityCheckModule`
- **Primary job:** Resolve uncertainty with practical specificity.
- **Behavior:**
  - User picks concern tab:
    - qualifications
    - process timeline
    - safety/deployment reality
    - benefits/pay-for-school
  - Each tab shows:
    - short plain-language explainer
    - FAQ accordion (Q&A grounded)
    - "what to do next" micro-CTA
  - Marks concern as resolved if user opens >=2 answers or clicks next CTA
- **Events:**
  - `ft_concern_tab_selected`
  - `ft_faq_item_opened`
  - `ft_concern_marked_resolved`
- **Desired assets:**
  - Structured FAQ bank for top concerns (`PARTIAL`)
  - Comparison cards (`myth` vs `reality`) (`MISSING`)
  - 1 visual per concern tab (`PARTIAL`)
- **Best source candidates:**
  - Existing Q&A DB and immersive Q&A matching logic (`HAVE`)
  - GoArmy benefits/scholarship/job pages (`HAVE`)

## Section S6: My Path Builder
- **Component ID:** `ft-path-builder`
- **UI Component:** `PathBuilder`
- **Primary job:** Turn passive browsing into personal plan intent.
- **Behavior:**
  - 3-5 short choice steps:
    1) what matters most now
    2) preferred work style
    3) support needed
    4) time horizon
  - Outputs:
    - top pillar
    - top 2 role clusters
    - top 3 next actions
  - Stores to runtime profile
- **Events:**
  - `ft_path_step_viewed`
  - `ft_path_option_selected`
  - `ft_path_generated`
- **Desired assets:**
  - Question set + answer mappings (`MISSING`, must author)
  - Role cluster metadata map (`PARTIAL`)
- **Best source candidates:**
  - GoArmy category/group taxonomy from CMT jobs feed (`HAVE`)

## Section S7: AI Copilot Moment
- **Component ID:** `ft-section-copilot`
- **UI Component:** `SectionCopilot`
- **Primary job:** Let users ask questions in context without losing flow.
- **Behavior:**
  - Inline collapsed widget in each major section
  - Starter prompts based on current section + lens + concern
  - AI response policy:
    - chat response grounded in Q&A
    - supporting media cards from relevant assets
  - `Show sources` toggle available for transparency
- **Events:**
  - `ft_copilot_opened`
  - `ft_copilot_prompt_clicked`
  - `ft_copilot_question_submitted`
  - `ft_copilot_answer_rendered`
- **Desired assets:**
  - Section-specific Q&A prompts (`PARTIAL`)
  - Mapped media retrieval by section (`PARTIAL`)
- **Best source candidates:**
  - Existing immersive chat endpoint + adapters (`HAVE`)

## Section S8: Warrior Journey Recap
- **Component ID:** `ft-journey-recap`
- **UI Component:** `JourneyRecap`
- **Primary job:** Reinforce progress and confidence.
- **Behavior:**
  - Render recap of:
    - selected lens
    - top pillar
    - concerns addressed
    - key strengths observed from interactions
  - Show 3 achievement badges:
    - `clarity gained`
    - `fit confidence`
    - `next step ready`
  - Generate personalized summary text
- **Events:**
  - `ft_recap_viewed`
  - `ft_recap_badge_viewed`
- **Desired assets:**
  - Recap template library by lens/pillar (`MISSING`, must author)

## Section S9: Action Lane + Save/Share
- **Component ID:** `ft-action-lane`
- **UI Component:** `ActionLane`
- **Primary job:** Convert momentum into action and retention loop.
- **Behavior:**
  - CTA priority computed by profile:
    - Talk to recruiter
    - Explore matching jobs
    - Save/share profile
  - Save/share creates re-entry URL with profile token
  - If user returns with token, restore state and show progress
- **Events:**
  - `ft_action_primary_clicked`
  - `ft_profile_saved`
  - `ft_profile_shared`
  - `ft_return_visit_resumed`
- **Desired assets:**
  - Share card visual template (`MISSING`)
  - CTA microcopy variants by lens (`PARTIAL`)

---

## 24) Asset Inventory Matrix (Current vs Needed)

### 24.1 High-priority assets for v1

| Asset Type | Target Qty | Current Status | Use Sections | Notes |
|---|---:|---|---|---|
| Hero stills/cover images | 6-10 | PARTIAL | S1, S2 | Have generic GoArmy images; need Field Tested-specific selects |
| Short video loops (6-12s, no audio required) | 8-12 | MISSING | S1, S4 | Strongly desirable for realism and social cadence |
| Story cards (ops/humans/field buckets) | 24-36 | PARTIAL | S4 | Need curated balanced set + captions |
| Pillar proof cards (4 pillars x 4 cards) | 16 | PARTIAL | S3 | Need metadata tagging by pillar |
| Practical FAQ modules | 20-40 Q&As | PARTIAL | S5, S7 | Q&A infra exists, curation needed |
| Concern visuals (4 concern tabs) | 8-12 | PARTIAL | S5 | Use existing media where possible |
| Path builder question map | 1 structured schema | MISSING | S6 | Must author with product + strategy |
| Recap templates (lens x pillar) | 12-20 | MISSING | S8 | Fast content task, high conversion impact |
| Shareable profile card templates | 4-6 | MISSING | S9 | Required for save/share loop |
| Representation-balanced portraits | 20+ | PARTIAL | S2, S4 | Need diversity audit and selection |

### 24.2 Assets already usable immediately
- GoArmy media images in DB (`131`) for initial card rendering.
- GoArmy knowledge pages (`305`) for factual support/fallback context.
- Existing Q&A and immersive orchestration pipeline.
- Existing card types and ranking/diversity logic.

### 24.3 Missing but critical for “premium” experience quality
- Field Tested-specific short video cutdowns.
- Campaign-tagged metadata for pillar and bucket routing.
- Recap/share creative templates.
- Structured path-builder content model.

---

## 25) Data Contract by Section (Implementation Spec)

### 25.1 Frontend runtime state
```ts
type FieldTestedProfile = {
  sessionId: string
  audienceLens: 'prospect' | 'parent' | 'influencer' | null
  topAttribute: 'strength' | 'skills' | 'support' | 'stability' | null
  confidenceScore: number // 0-100
  concernFlags: Array<'autonomy' | 'safety' | 'fit' | 'timeline' | 'benefits'>
  contentAffinity: Array<'story' | 'practical' | 'benefits' | 'non_combat' | 'team'>
  completedSections: string[]
  recap: {
    badges: string[]
    summary: string
    nextActions: string[]
  } | null
}
```

### 25.2 Section content payload shape
```ts
type CampaignSectionPayload = {
  sectionId: string
  title: string
  body?: string
  cards: Array<{
    id: string
    type: 'image' | 'video' | 'table' | 'insight' | 'cta'
    title: string
    body?: string
    sourceUrl?: string
    metadata?: {
      pillar?: 'strength' | 'skills' | 'support' | 'stability'
      bucket?: 'operations' | 'humans' | 'field'
      audienceLensFit?: Array<'prospect' | 'parent' | 'influencer'>
      concernFit?: string[]
    }
  }>
  prompts?: string[]
  faqIds?: string[]
}
```

### 25.3 API mode extension
- Extend existing immersive endpoint with request hints:
  - `campaignMode: "field_tested"`
  - `sectionId`
  - `audienceLens`
  - `topAttribute`
  - `concernFlags`
- Response must include:
  - Q&A-grounded answer
  - ranked content cards
  - suggested next prompts

---

## 26) Component Behavior Details (State Machines)

### 26.1 `WarriorWheelInteractive` state machine
- `idle` -> `hovering(segment)` -> `selected(segment)` -> `content_loaded` -> `completed`
- Guard:
  - At least one segment selection required to unlock S4
- Error:
  - If no content found for segment, fallback to generic pillar card set

### 26.2 `FieldStoryStack` state machine
- `loading` -> `card_ready` -> `response_captured` -> `next_card`
- Completion condition:
  - `cardsReviewed >= 5` OR `timeSpent >= 90s and cardsReviewed >= 3`
- Adaptive behavior:
  - If user repeatedly selects `Need details`, route earlier to S5

### 26.3 `RealityCheckModule` state machine
- `concern_select` -> `faq_expand` -> `clarification` -> `resolved`
- Completion:
  - 2 FAQ opens + 1 CTA interaction OR explicit "I got what I needed"

### 26.4 `PathBuilder` state machine
- `step_1` -> `step_2` -> `step_3` -> `step_4(optional)` -> `result_generated`
- Branching:
  - If lens=parent, include support/safety-weighted variants
  - If lens=influencer, include representation/authenticity-weighted variants

### 26.5 `JourneyRecap` state machine
- `generate` -> `preview` -> `edit(optional)` -> `save/share`

---

## 27) Section-level Acceptance Criteria

## S1 Hero
- Loads in < 1.2s with first paint text visible.
- Primary CTA click-through >= 35% in internal pilot.

## S2 Lens Selector
- Exactly one lens selected before S3.
- Lens reflected in all downstream headers/copy.

## S3 Warrior Wheel
- Segment selection updates profile top attribute.
- Side panel content refreshes under 300ms after interaction.

## S4 Story Stack
- At least 3 buckets represented in first 6 cards.
- No duplicate source URL in first 10 cards.

## S5 Reality Check
- Concern tabs available and populated.
- If concern selected, at least 3 relevant FAQ answers available.

## S6 Path Builder
- Produces deterministic output given same answer set.
- Output includes top 3 actions and at least 1 role cluster.

## S7 AI Copilot
- Q&A-grounded response present for top prompts.
- If no direct Q&A match, fallback message + suggested prompts shown.

## S8 Recap
- Generates summary text tied to selected lens + top attribute.
- Displays resolved concern count.

## S9 Action Lane
- Primary CTA dynamically reorders based on profile.
- Save/share returns resumable state link.

---

## 28) Build Order (Engineer-Ready)

### Sprint A (foundation)
1. Route scaffold + section containers
2. Runtime profile store (client-side)
3. Lens selector + progression gating
4. Static Warrior Wheel with hardcoded content

### Sprint B (data-driven interactions)
1. Wire card retrieval for S3/S4 from existing adapters
2. Implement Story Stack responses and profile updates
3. Implement Reality Check tabs with Q&A-backed content

### Sprint C (copilot + recap + conversion)
1. Inline section copilot integration
2. Path builder + recap generation
3. Action lane dynamic CTA
4. Save/share profile endpoints

### Sprint D (quality and optimization)
1. Metadata tagging backfill scripts
2. Analytics dashboard wiring
3. A/B variant toggles and QA pass

---

## 29) Immediate Asset Curation Backlog (Content Team)

1. Curate 36 image cards from current DB:
   - 12 operations
   - 12 humans
   - 12 field
2. Author 20 practical Q&As grouped by concern flags.
3. Author 12 recap templates:
   - 3 lenses x 4 top attributes.
4. Create 6 share-card copy templates:
   - confidence-focused
   - skills-focused
   - support-focused
   - stability-focused
   - parent reassurance
   - influencer talking-point
5. Mark assets with initial tags (`pillar`, `bucket`, `lens_fit`) in metadata.

---

## 30) Feasibility Notes (Concrete)

- **Can build now with existing stack:** S1-S5 and baseline S7 using current immersive/Q&A/media systems.
- **Requires small new backend work:** profile save/share endpoint and metadata tagging helpers.
- **Requires content production, not infrastructure:** recap templates, share cards, path question map.
- **High-impact future upgrade:** add short video inventory to improve realism and engagement depth.

