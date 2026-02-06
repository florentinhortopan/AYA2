# Segue Pills + Chatbot Integration Strategy

## 🎯 Goal
Integrate segue pills into the existing `ProjectChatbot` widget so that:
1. **Q&A testing** (existing RAG functionality) continues to work
2. **Pills appear** during the first phases of conversation
3. **Both features work together** seamlessly for comprehensive testing
4. **Testers can configure** which pills to use and simulate different use cases

---

## 🏗️ Architecture Overview

### Current State
```
ProjectChatbot Component
├── RAG-based Q&A matching (existing)
├── Status filters (question/answer)
├── Message history
└── Simple text input/output
```

### Target State
```
Enhanced ProjectChatbot Component
├── RAG-based Q&A matching (existing - unchanged)
├── Status filters (question/answer)
├── Message history
├── Segue Pills System (NEW)
│   ├── Pill selection logic (when to show)
│   ├── Pill display (below assistant messages)
│   ├── Pill click handler (sends as user message)
│   └── Configuration UI (which research/goal/use case)
└── Text input/output
```

---

## 📋 Integration Strategy

### Phase 1: Pill Display Logic

**When to Show Pills:**
- **First 3 assistant messages** (first phases of conversation)
- **After each assistant response** (until 3 pills shown)
- **Not shown** if user already clicked a pill (to avoid repetition)
- **Not shown** if conversation is > 5 messages (moved past "first phases")

**Pill Selection:**
- Based on **selected project** → link to a `SeguePillResearch` record
- Based on **selected campaign goal** → influences pill selection
- Based on **simulated use case** (1, 2, or 3) → determines which recommendation set to use

---

### Phase 2: Configuration UI

Add a new section in the chatbot widget for pill configuration:

```
┌─────────────────────────────────────────────────────────────┐
│  Project Sandbox Assistant                    [Close]      │
├─────────────────────────────────────────────────────────────┤
│  [Project selector] (existing)                              │
│  [Question/Answer status filters] (existing)               │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🎯 Segue Pills Testing                                 │ │
│  │ [☑ Enable Pills]                                      │ │
│  │                                                         │ │
│  │ Research Project: [Select research... ▾]               │ │
│  │ Campaign Goal: [Select goal... ▾]                      │ │
│  │ Simulate Use Case: [Case 1 ▾] [Case 2] [Case 3]       │ │
│  │                                                         │ │
│  │ Show pills for: [First 3 messages]                    │ │
│  └───────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  [Chat messages area]                                       │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Assistant: Here's the answer...                       │ │
│  │                                                         │ │
│  │ [Pill 1] [Pill 2] [Pill 3] [Pill 4]  ← Pills appear  │ │
│  └───────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  [Input field] [Send]                                       │
└─────────────────────────────────────────────────────────────┘
```

---

### Phase 3: Data Flow

**1. Initial Load:**
```typescript
// When chatbot opens and pills are enabled
1. Fetch available SeguePillResearch records (linked to current project or all)
2. Fetch available SegueCampaignGoal records
3. Load pill recommendations for selected research + goal + use case
4. Store pills in component state
```

**2. Message Flow:**
```typescript
// When assistant sends a message
1. Check: Should we show pills? (message count < 3, pills enabled, not already clicked)
2. If yes: Display pills below assistant message
3. If no: Continue normal flow

// When user clicks a pill
1. Pill label becomes user message
2. Send to RAG endpoint (same as typing)
3. Mark pill as "used" (don't show again)
4. Increment pill click counter
```

**3. Pill Selection Logic:**
```typescript
// Determine which pills to show
function getPillsForMessage(
  messageIndex: number,
  researchId: string,
  campaignGoalId: string | null,
  useCase: 1 | 2 | 3
): PillLabel[] {
  // Load recommendations from research
  const recommendations = await loadRecommendations(researchId, campaignGoalId)
  
  // Select based on use case
  const caseRec = useCase === 1 ? recommendations.case1 :
                  useCase === 2 ? recommendations.case2 :
                                  recommendations.case3
  
  return caseRec.pills
}
```

---

## 🔧 Implementation Plan

### Step 1: Extend ProjectChatbot Component

**New Props:**
```typescript
interface ProjectChatbotProps {
  projectId: string
  enablePills?: boolean  // Optional: enable pills feature
  defaultResearchId?: string  // Optional: pre-select a research
  defaultCampaignGoalId?: string  // Optional: pre-select a goal
  defaultUseCase?: 1 | 2 | 3  // Optional: default use case
}
```

**New State:**
```typescript
const [pillsEnabled, setPillsEnabled] = useState(false)
const [selectedResearchId, setSelectedResearchId] = useState<string | null>(null)
const [selectedCampaignGoalId, setSelectedCampaignGoalId] = useState<string | null>(null)
const [selectedUseCase, setSelectedUseCase] = useState<1 | 2 | 3>(1)
const [availableResearches, setAvailableResearches] = useState<SeguePillResearch[]>([])
const [availableCampaignGoals, setAvailableCampaignGoals] = useState<SegueCampaignGoal[]>([])
const [currentPills, setCurrentPills] = useState<PillLabel[]>([])
const [usedPillIds, setUsedPillIds] = useState<Set<string>>(new Set())
const [pillsShownCount, setPillsShownCount] = useState(0)
```

---

### Step 2: Create API Endpoints

**1. Fetch Available Researches:**
```typescript
// GET /api/segue-pills/researches?projectId=xxx
// Returns: List of SeguePillResearch records
// Optionally filtered by project (if we link researches to projects)
```

**2. Fetch Pill Recommendations:**
```typescript
// GET /api/segue-pills/researches/[researchId]/recommendations?campaignGoalId=xxx&useCase=1
// Returns: PillRecommendations object with case1, case2, case3
// Uses existing pill-recommender logic
```

**3. Track Pill Usage (Optional):**
```typescript
// POST /api/segue-pills/test-sessions
// Body: { researchId, clickedPill, testCase, testerId }
// Creates TestSession record for analytics
```

---

### Step 3: UI Components

**1. Pills Configuration Panel:**
```tsx
<div className="border-b border-border px-4 py-3 space-y-3">
  {/* Existing project/status filters */}
  
  {/* NEW: Pills Configuration */}
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={pillsEnabled}
        onChange={(e) => setPillsEnabled(e.target.checked)}
      />
      <p className="text-xs text-muted-foreground">Enable Segue Pills</p>
    </div>
    
    {pillsEnabled && (
      <>
        <Select value={selectedResearchId || ''} onValueChange={setSelectedResearchId}>
          <SelectTrigger>
            <SelectValue placeholder="Select research project" />
          </SelectTrigger>
          <SelectContent>
            {availableResearches.map((research) => (
              <SelectItem key={research.id} value={research.id}>
                {research.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedCampaignGoalId || ''} onValueChange={setSelectedCampaignGoalId}>
          <SelectTrigger>
            <SelectValue placeholder="Select campaign goal (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {availableCampaignGoals.map((goal) => (
              <SelectItem key={goal.id} value={goal.id}>
                {goal.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={selectedUseCase === 1 ? 'default' : 'outline'}
            onClick={() => setSelectedUseCase(1)}
          >
            Case 1
          </Button>
          <Button
            size="sm"
            variant={selectedUseCase === 2 ? 'default' : 'outline'}
            onClick={() => setSelectedUseCase(2)}
          >
            Case 2
          </Button>
          <Button
            size="sm"
            variant={selectedUseCase === 3 ? 'default' : 'outline'}
            onClick={() => setSelectedUseCase(3)}
          >
            Case 3
          </Button>
        </div>
      </>
    )}
  </div>
</div>
```

**2. Pills Display Component:**
```tsx
interface PillsDisplayProps {
  pills: PillLabel[]
  onPillClick: (pill: PillLabel) => void
  usedPillIds: Set<string>
}

function PillsDisplay({ pills, onPillClick, usedPillIds }: PillsDisplayProps) {
  const availablePills = pills.filter(p => !usedPillIds.has(p.id))
  
  if (availablePills.length === 0) return null
  
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {availablePills.map((pill) => (
        <Button
          key={pill.id}
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => onPillClick(pill)}
        >
          {pill.label}
        </Button>
      ))}
    </div>
  )
}
```

**3. Enhanced Message Display:**
```tsx
{messages.map((message, index) => (
  <div key={`${message.timestamp}-${index}`} className="...">
    {/* Existing message bubble */}
    <div className={...}>
      {message.content.split('\n').map((line, idx) => (
        <p key={idx}>{line}</p>
      ))}
    </div>
    
    {/* NEW: Show pills after assistant messages */}
    {message.role === 'assistant' && 
     pillsEnabled && 
     pillsShownCount < 3 && 
     index === messages.length - 1 && (
      <PillsDisplay
        pills={currentPills}
        onPillClick={handlePillClick}
        usedPillIds={usedPillIds}
      />
    )}
  </div>
))}
```

---

### Step 4: Pill Click Handler

```typescript
const handlePillClick = async (pill: PillLabel) => {
  // 1. Mark pill as used
  setUsedPillIds(prev => new Set([...prev, pill.id]))
  
  // 2. Send pill label as user message
  const userMessage: ChatMessage = {
    role: 'user',
    content: pill.label,
    timestamp: new Date().toISOString()
  }
  
  setMessages(current => [...current, userMessage])
  
  // 3. Trigger RAG lookup (same as typing)
  setInput(pill.label)
  await sendMessage()
  
  // 4. Track usage (optional analytics)
  if (selectedResearchId) {
    await fetch('/api/segue-pills/test-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        researchId: selectedResearchId,
        clickedPill: pill.label,
        testCase: selectedUseCase,
        testerId: userId // from session
      })
    })
  }
  
  // 5. Increment pills shown count
  setPillsShownCount(prev => prev + 1)
}
```

---

### Step 5: Load Pills on Configuration Change

```typescript
useEffect(() => {
  const loadPills = async () => {
    if (!pillsEnabled || !selectedResearchId) {
      setCurrentPills([])
      return
    }
    
    try {
      const url = `/api/segue-pills/researches/${selectedResearchId}/recommendations?` +
                  `campaignGoalId=${selectedCampaignGoalId || ''}&useCase=${selectedUseCase}`
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to load pills')
      
      const data = await response.json()
      
      // Select pills based on use case
      const recommendations = data.recommendations
      const caseRec = selectedUseCase === 1 ? recommendations.case1 :
                      selectedUseCase === 2 ? recommendations.case2 :
                                              recommendations.case3
      
      setCurrentPills(caseRec.pills || [])
    } catch (error) {
      console.error('Failed to load pills:', error)
      setCurrentPills([])
    }
  }
  
  loadPills()
}, [pillsEnabled, selectedResearchId, selectedCampaignGoalId, selectedUseCase])
```

---

## 🔗 Linking Researches to Projects

### Option 1: Direct Link (Recommended)
Add `projectId` field to `SeguePillResearch`:
```prisma
model SeguePillResearch {
  // ... existing fields
  projectId String?  // Link to QA project
  project   QaProject? @relation(fields: [projectId], references: [id])
}
```

**Benefits:**
- Clear relationship: one research per project
- Easy filtering: show only researches for current project
- Logical grouping: pills tested with same Q&A set

### Option 2: Manual Selection
Keep researches independent, user selects manually.

**Benefits:**
- More flexible: can test pills from any research
- No schema changes needed

**Recommendation:** Start with Option 2 (manual selection), add Option 1 later if needed.

---

## 📊 Testing Workflow

### Scenario 1: Test Q&A Only (Current Behavior)
1. Open chatbot
2. Don't enable pills
3. Type questions → get RAG answers
4. ✅ Works exactly as before

### Scenario 2: Test Pills Only
1. Open chatbot
2. Enable pills
3. Select research + goal + use case
4. Click pills → see RAG answers
5. ✅ Test pill effectiveness

### Scenario 3: Test Q&A + Pills Together
1. Open chatbot
2. Enable pills
3. Select research + goal + use case
4. **Type a question** → get RAG answer → see pills
5. **Click a pill** → get RAG answer → see pills
6. **Type another question** → get RAG answer → see pills
7. ✅ Comprehensive testing of both systems

---

## 🎨 Visual Design

### Pills Styling
```tsx
// Different styles for different pill types
const pillVariants = {
  anticipate: 'outline',      // Default outline
  entice: 'secondary',         // Secondary color
  cta: 'default'              // Primary color (more prominent)
}

<Button
  variant={pillVariants[pill.type]}
  size="sm"
  className="text-xs"
  onClick={() => onPillClick(pill)}
>
  {pill.label}
</Button>
```

### Pills Layout
```
┌─────────────────────────────────────────────┐
│ Assistant: Here's information about...       │
│                                              │
│ [Explore careers] [Check eligibility]      │
│ [See benefits] [Talk to a recruiter]        │
└─────────────────────────────────────────────┘
```

---

## 🚀 Implementation Steps

### Phase 1: Basic Integration (2-3 days)
- [ ] Add pills configuration UI to ProjectChatbot
- [ ] Create API endpoint to fetch researches
- [ ] Create API endpoint to fetch recommendations
- [ ] Add pills display component
- [ ] Implement pill click handler
- [ ] Test basic flow

### Phase 2: Enhanced Features (1-2 days)
- [ ] Add pill usage tracking (TestSession)
- [ ] Add pills shown counter logic
- [ ] Improve pill styling (type-based variants)
- [ ] Add loading states
- [ ] Add error handling

### Phase 3: Polish (1 day)
- [ ] Add tooltips explaining use cases
- [ ] Add visual indicators (which pills used)
- [ ] Add analytics dashboard link
- [ ] Documentation

**Total: ~4-6 days**

---

## 🔍 Edge Cases

### Edge Case 1: No Pills Available
**Scenario:** Research selected but no pills generated yet
**Solution:** Show message: "No pills available. Generate pills in Research Lab first."

### Edge Case 2: All Pills Used
**Scenario:** User clicked all 4 pills, still in first 3 messages
**Solution:** Don't show pills anymore (pillsShownCount >= 3)

### Edge Case 3: Research Changed Mid-Conversation
**Scenario:** User changes research selection while chatting
**Solution:** Reset pillsShownCount, reload pills, continue conversation

### Edge Case 4: RAG Returns No Answer
**Scenario:** Clicked pill doesn't match any Q&A
**Solution:** Show normal "no match" message, don't show pills again for that response

---

## 📈 Future Enhancements

### 1. Dynamic Pill Selection
Instead of pre-loading all pills, select pills dynamically based on:
- Current conversation context
- Last assistant message topic
- User's question history

### 2. Pill Performance Tracking
Track which pills lead to:
- Successful Q&A matches
- User satisfaction
- Conversion events

### 3. A/B Testing
Test different pill sets:
- Variant A: Research A pills
- Variant B: Research B pills
- Compare performance

### 4. Confidence-Based Display
Show pills only when:
- RAG confidence is high
- User engagement is high
- Context is clear

---

## 💡 Key Benefits

1. **Reuses Existing Infrastructure**
   - Same chatbot widget
   - Same RAG system
   - Same Q&A database

2. **Comprehensive Testing**
   - Test Q&A quality
   - Test pill effectiveness
   - Test both together

3. **Flexible Configuration**
   - Choose research project
   - Choose campaign goal
   - Simulate different use cases

4. **Realistic Simulation**
   - Pills appear naturally in conversation
   - User can click or type
   - Mirrors real chatbot experience

---

## 📝 Summary

**What We're Building:**
- Enhanced `ProjectChatbot` with optional pills
- Configuration UI for pills (research, goal, use case)
- Pills display after assistant messages (first 3)
- Pill click → sends as user message → triggers RAG
- Both Q&A and pills work together seamlessly

**What Stays the Same:**
- RAG matching logic (unchanged)
- Q&A database (unchanged)
- Status filters (unchanged)
- Message history (unchanged)

**What's New:**
- Pills configuration panel
- Pills display component
- Pill click handler
- API endpoints for pills
- Optional usage tracking

**Timeline:** 4-6 days for full implementation

---

Ready to implement? Let me know if you want to start with Phase 1!