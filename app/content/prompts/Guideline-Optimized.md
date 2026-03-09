# U.S. Army Q&A Generation Guidelines (Optimized)

**Version:** 2.0  
**Purpose:** Validation, fact-checking, and quality assurance for Question and Answer generation  
**Last Updated:** February 2025

---

## Core Principles

1. **Accuracy First**: Only use information explicitly found on goarmy.com pages
2. **Source Verification**: Every fact must be traceable to a specific goarmy.com URL
3. **User-Centric**: Questions and answers should reflect how real users think and ask
4. **Consistency**: Maintain professional, conversational tone across all content

---

## Question Generation Guidelines

### Topic Extraction Rules

- **Derive topics directly from URL content**: Topics must be visible on the provided pages
- **3-7 topics per batch**: Balance coverage with specificity
- **Topic naming**: Use clear, specific labels (e.g., "ASVAB Testing" not "Tests")
- **Avoid generic topics**: Prefer "Eligibility Requirements" over "General Information"

### Persona Assignment

- **Prospect**: Default for most questions (first-time visitors exploring enlistment)
- **Family Member**: Use when question involves family considerations (spouse, children, parents)
- **Career Seeker**: Use when question focuses on career paths, MOS selection, or job training
- **Veteran**: Use when question references prior service or transition scenarios

**Assignment Logic:**
- If question mentions "my family" or "spouse/children" → Family Member
- If question asks about "careers" or "jobs" or "MOS" → Career Seeker
- If question mentions "previous service" or "re-enlistment" → Veteran
- Otherwise → Prospect

### Tone Variation

- **Neutral**: Factual, straightforward questions (most common)
- **Positive**: Enthusiastic, optimistic phrasing ("I'm excited to...", "I'm ready to...")
- **Skeptical**: Cautious, questioning phrasing ("Do I really need to...", "Is it true that...")

**Distribution Target:**
- 60% Neutral
- 25% Positive
- 15% Skeptical

### Question Quality Checks

✅ **VALID Questions:**
- Directly answerable from provided URLs
- Specific and grounded in page content
- Natural, conversational phrasing
- Varied question structures (what, how, when, can I, do I need to)

❌ **INVALID Questions:**
- Generic or vague ("Tell me about the Army")
- Assumes information not on provided pages
- Near-duplicate of another question (same intent)
- Overly specific when content only supports general answer

### Source URL Requirements

- **Must be from provided URLs**: Only use URLs supplied by user
- **Comma-separated if multiple**: List all relevant URLs
- **Verify relevance**: URL must actually contain information to answer the question
- **No placeholder URLs**: Do not invent or assume URLs

---

## Answer Generation Guidelines

### Fact Validation Rules

**CRITICAL: Never Invent Facts**

- ✅ **DO**: Use only facts visible on the cited goarmy.com page
- ✅ **DO**: Omit numbers if not visible on the page
- ✅ **DO**: Use phrases like "typically" or "generally" when specifics aren't available
- ❌ **DON'T**: Make up statistics, dates, or requirements
- ❌ **DON'T**: Assume details not explicitly stated
- ❌ **DON'T**: Use outdated information from memory

**Validation Checklist:**
1. Can I see this fact on the source page?
2. Is this number/date explicitly stated?
3. Would a user reading the page find this information?
4. Am I inferring or assuming anything?

### Answer Variant Spectrum

**very_direct** (Core fact first):
- Lead with the most important fact
- 1-2 supporting details maximum
- Example: "You must be at least 17 years old with parental consent or 18 without consent to enlist in the Army. A high school diploma or GED is required."

**direct** (Key rule + qualifier):
- State the main requirement
- Add one contextual qualifier (eligibility, component, timing)
- Example: "To join the Army, you need to be between 17-35 years old, be a U.S. citizen or permanent resident, and have a high school diploma or GED. Age waivers are available on a case-by-case basis for qualified candidates."

**somewhat_direct** (Rule + caveat):
- Include the main requirement
- Add one dependency or exception (age, MOS, component)
- Example: "Basic eligibility requires being 17-35 years old, U.S. citizenship or permanent residency, and a high school diploma or GED. However, specific Military Occupational Specialties (MOS) may have additional requirements like higher ASVAB scores or security clearances."

**indirect** (Next steps focus):
- Guide user to verification channels
- Don't lead with numbers
- Example: "Eligibility requirements vary based on your specific situation and the career path you're interested in. The best way to determine your eligibility is to meet with an Army recruiter, who can review your background, discuss available options, and help you understand any waivers that might apply to your circumstances."

### Length Requirements

- **Target**: 400-500 characters per answer (including spaces and punctuation)
- **Minimum**: 350 characters
- **Maximum**: 550 characters
- **Count carefully**: Verify character count before finalizing

### Tone and Style

**Professional but Conversational:**
- ✅ Use "you" and "your" (direct address)
- ✅ Use contractions naturally ("you'll", "it's", "don't")
- ✅ Avoid military jargon without explanation
- ✅ Keep sentences clear and concise

**Avoid:**
- ❌ Overly formal language ("One must...", "It is required that...")
- ❌ Slang or casual expressions
- ❌ Assumptions about user knowledge
- ❌ Promotional language ("amazing opportunity", "best decision")

### Source Link Validation

**Requirements:**
- Must be a valid goarmy.com URL
- Must be HTTP 200 (page exists and is accessible)
- Must contain the facts cited in the answer
- Use the most specific/relevant page (not homepage)

**If No Suitable Page Exists:**
- Set `source_link` to: `not found on goarmy.com`
- Still provide answer if information can be inferred from related pages
- Note in answer that specific page doesn't exist

### Keyword Extraction

**Rules:**
- Extract 5 keywords per answer
- Use lowercase, comma-separated format
- Keywords should be:
  - Relevant to the question topic
  - SEO-friendly (terms users might search)
  - Specific but not overly narrow
  - Include main topic + 2-3 related terms

**Examples:**
- Question about eligibility → `enlistment,eligibility,requirements,army,goarmy`
- Question about ASVAB → `asvab,testing,military,aptitude,army`
- Question about benefits → `benefits,pay,compensation,army,enlistment`

---

## Quality Assurance Checklist

### For Questions

- [ ] Question is directly answerable from provided URLs
- [ ] Topic is specific and derived from page content
- [ ] Persona assignment matches question context
- [ ] Tone variation is appropriate
- [ ] No near-duplicates (same intent as another question)
- [ ] Source URLs are valid and relevant

### For Answers

- [ ] All facts are visible on the source page
- [ ] No invented numbers or statistics
- [ ] Four variants show clear differences in approach
- [ ] Each answer is 400-500 characters
- [ ] Tone is professional but conversational
- [ ] Source link is valid goarmy.com URL or "not found on goarmy.com"
- [ ] Keywords are relevant and SEO-friendly
- [ ] Variants don't contradict each other

---

## Common Pitfalls to Avoid

### Question Generation

1. **Over-generic topics**: "General Information" → Use "Eligibility Basics" or "Enlistment Overview"
2. **Assumed personas**: Don't default to "Prospect" if question clearly indicates another persona
3. **Duplicate intents**: "What are the requirements?" and "What do I need to join?" are duplicates
4. **Invented URLs**: Only use URLs provided by user

### Answer Generation

1. **Invented statistics**: "90% of recruits..." when page doesn't state this
2. **Assumed requirements**: Don't add requirements not mentioned on page
3. **Similar variants**: All four variants shouldn't say the same thing differently
4. **Wrong source links**: Don't use homepage when specific page exists
5. **Character count errors**: Verify actual count, don't estimate

---

## Validation Workflow

### Step 1: Fact Verification
- Read the source page carefully
- Identify all facts used in answer
- Verify each fact appears on page
- Flag any assumptions or inferences

### Step 2: Variant Differentiation
- Ensure each variant takes a different approach
- Verify length requirements met
- Check tone consistency
- Confirm no contradictions

### Step 3: Source Link Check
- Verify URL is valid goarmy.com domain
- Confirm page contains cited information
- Use most specific page available
- Mark as "not found" if no suitable page

### Step 4: Final Review
- Character count verification
- Keyword relevance check
- Overall quality assessment
- Consistency with other answers

---

## Examples

### Good Question Example

```
topic: ASVAB Testing
persona: Career Seeker
tone: Neutral
question: What is the minimum ASVAB score required to join the Army?
source_urls: https://www.goarmy.com/how-to-join/steps-to-enlist
```

**Why it's good:**
- Specific topic derived from URL
- Persona matches (career-focused question)
- Directly answerable from source
- Natural phrasing

### Good Answer Example

**very_direct variant:**
"The minimum ASVAB score required to join the Army is 31 percentile. This score determines which Military Occupational Specialties (MOS) you qualify for, with higher scores unlocking more career options."

**direct variant:**
"To join the Army, you need an ASVAB score of at least 31 percentile. However, specific MOS categories require higher scores—technical and cyber roles typically need 50-70+, while combat roles start at 31."

**Why it's good:**
- Clear differentiation between variants
- Facts traceable to source
- Appropriate length
- Professional but conversational tone

---

## Updates and Maintenance

- Review guidelines quarterly for accuracy
- Update when goarmy.com structure changes
- Incorporate feedback from content validation
- Maintain version history for reference

---

**Remember**: When in doubt, prioritize accuracy over completeness. It's better to omit information than to invent it.
