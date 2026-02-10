# GailGPT Response Experience
## Product Specification v1.0

---

## Overview

This document specifies the user experience from the moment an insurance professional submits a query to when they receive a complete response. The goal is to create a **feeling of intelligent partnership** — the user should sense that Gail understood their intent, is working thoughtfully, and delivers with precision.

The experience should make an insurance agent say: *"Holy shit, this actually gets it."*

---

## Design Principles

### 1. Transparency Without Overwhelm
Show the AI is working intelligently, but don't expose every internal operation. Users want confidence, not a debugging console.

### 2. Progressive Disclosure
Surface the right information at the right time. Summary first, details on demand.

### 3. Consistent Containers
The UI should never "transform" jarringly between states. Components should feel like they're evolving, not being replaced.

### 4. Domain-Aware Intelligence
The thinking/status layer should reflect insurance-specific understanding. Generic "Processing..." is a missed opportunity.

---

## Interaction Flow

### State 1: Input Submitted (0-200ms)

**What happens:**
- User's message appears in the conversation (right-aligned, user bubble)
- Gail's response container appears immediately below
- A subtle entrance animation (fade + slight upward slide, 150ms, ease-out)

**Visual elements:**
- Gail avatar/icon appears (the blue "G" mark)
- Thinking indicator appears inline: a warm-colored animated element (the spark/asterisk)
- No text yet — just the indicator

**Why this matters:**
Immediate visual response eliminates the "did it work?" anxiety. The animation creates a sense of arrival, not sudden appearance.

---

### State 2: Thinking In Progress (200ms - completion)

**What happens:**
- The thinking summary line appears and may update as the model processes
- Below it, the response begins streaming

**Visual structure:**
```
┌─────────────────────────────────────────────────────────┐
│ [G]  ┌──────────────────────────────────────────────┐  │
│      │ [spinner] Analyzing coverage requirements... │  │
│      │            ↑ collapsible                     │  │
│      └──────────────────────────────────────────────┘  │
│                                                         │
│      Response text streams here, word by word...        │
│      More text appears...                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**The Thinking Summary Line:**

This is the most important UX element. It serves three purposes:
1. **Confirms understanding** — Shows Gail parsed the intent correctly
2. **Sets expectations** — Indicates what kind of response is coming
3. **Provides transparency** — Optional expansion reveals the reasoning

**Summary line behavior:**
- Appears with the spark/spinner indicator on the left
- Text is dynamic, generated from the model's initial assessment
- Should feel like a competent colleague's quick acknowledgment

**Example summary lines (insurance-specific):**
- "Understood — pulling up GL coverage requirements for contractors"
- "Reviewing ACORD 125 structure for the fields you need"
- "Checking COI compliance against your carrier's requirements"
- "This is a standard BOP question — preparing overview"
- "Comparing coverage options across your available markets"

**For simple/general questions:**
- "Straightforward question — preparing clear explanation"
- "Got it — walking through the fundamentals"

**What NOT to do:**
- Generic "Thinking..." with no context
- Multi-step checklists that don't map to real operations
- Fake stages that complete on timers rather than actual events

---

### State 3: Tool Use (Conditional)

**When Gail uses tools** (reading documents, generating COIs, searching), the thinking block should reflect actual operations:

```
┌──────────────────────────────────────────────────────────┐
│ [spinner] Reading uploaded ACORD form...                 │
│    └─ Extracted: Policy #, Effective dates, Limits      │
│                                                          │
│ [checkmark] Identified 3 coverage gaps                   │
│ [spinner] Generating comparison table...                 │
└──────────────────────────────────────────────────────────┘
```

**Rules for tool-use display:**
- Only show steps that correspond to real tool calls
- Each step appears when the tool is invoked, completes when it returns
- Sub-details (like "Extracted: ...") are optional progressive disclosure
- Timing is authentic — fast tools complete fast, slow tools show progress

**This is where "wow" moments live:**
When an agent uploads a dec page and sees "Extracted: Policyholder name, Coverage A limit, Deductible schedule" — that's the moment they realize Gail actually understands insurance documents.

---

### State 4: Response Streaming

**Behavior:**
- Text streams word-by-word or in small chunks
- Streaming should feel natural, not jarring (aim for ~30-50 tokens/second visual pace)
- Markdown renders in real-time (headers, bold, lists appear formatted as they stream)
- Code blocks or structured content (tables) may buffer slightly before rendering

**Scroll behavior:**
- If user hasn't scrolled, auto-scroll to keep newest content visible
- If user scrolls up to review, stop auto-scrolling (they're reading)
- Provide a "↓ Jump to latest" button if they've scrolled away and content is still streaming

---

### State 5: Response Complete

**What happens:**
- Streaming stops
- Thinking indicator transitions from spinner to checkmark (subtle color shift: orange → green, or animated completion)
- The thinking block remains in place, collapsed by default
- Summary line persists as a record of what Gail understood

**Visual structure (final state):**
```
┌─────────────────────────────────────────────────────────┐
│ [G]  ┌──────────────────────────────────────────────┐  │
│      │ [✓] Analyzed GL requirements for contractor  │  │
│      │     ▶ (expandable)                           │  │
│      └──────────────────────────────────────────────┘  │
│                                                         │
│      [Complete response text with formatting]           │
│                                                         │
│      ┌─────────────────────────────────────────────┐   │
│      │ 📎 Generated: COI_Contractor_2024.pdf       │   │
│      │    [Download] [Preview]                      │   │
│      └─────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Artifact/output treatment:**
When Gail produces artifacts (COIs, comparison tables, filled forms), they appear as distinct, actionable cards below the response — not buried in text.

---

## Expanded Thinking View

When users click to expand the thinking block:

**Content:**
- The actual chain-of-thought reasoning (if using extended thinking)
- Or a structured summary of what Gail considered

**Tone:**
- First person from Gail's perspective
- Professional but transparent
- Should feel like reading a smart colleague's notes

**Example:**
```
The user is asking about additional insured requirements for a
subcontractor agreement. This involves:

1. Understanding who needs to be listed as AI (the GC, probably)
2. Whether they need AI status on GL, Auto, or Umbrella
3. Common endorsement forms (CG 20 10, CG 20 37)

I'll explain the standard approach and flag the key decision
points they'll need to confirm with their carrier.
```

**What NOT to show:**
- Raw model tokens or technical artifacts
- Repetitive self-dialogue
- Uncertainty that undermines confidence (e.g., "I'm not sure if...")

---

## Micro-interactions & Polish

### The Spark/Indicator
- Animated subtly (gentle pulse or rotation)
- Color: warm tone (orange/amber) during processing
- Transitions to checkmark (green or muted) on completion
- Animation should feel organic, not mechanical

### Transitions
- All state changes animated (150-200ms, ease-out)
- No sudden appearance/disappearance of elements
- Thinking block doesn't "pop in" — it fades and slides

### Streaming Text
- Cursor or subtle highlight on the latest word (optional)
- No flickering or layout shifts as text appears

### Sound (Optional, Off by Default)
- Subtle audio cue when response completes
- Satisfying but not intrusive (think: Slack's gentle sounds)

---

## Edge Cases

### Very Fast Responses (<500ms)
- Still show the thinking block briefly (minimum 300ms display)
- Don't skip the "understood" moment — it builds trust
- Animate through states smoothly, just quickly

### Very Long Responses
- Thinking block stays pinned at top of Gail's response
- Consider a progress indicator if generation exceeds 30s
- Allow user to stop generation

### Errors
- Thinking block transitions to error state (not a separate component)
- Clear, actionable error message
- Retry option inline

### User Interruption (New Message While Generating)
- Current response completes or gracefully stops
- New query takes precedence
- Previous partial response remains visible but marked incomplete

### No Thinking Needed (Very Simple Queries)
- Still show a brief acknowledgment, but can be minimal
- "Got it" → immediate response
- Don't fake elaborate thinking for "What time is it?"

---

## Technical Implementation Notes

### Thinking Summary Generation
The summary line should come from the model's initial reasoning, not be hardcoded. Options:

1. **If using extended thinking:** Parse the first ~100 tokens of thinking to extract intent
2. **If not:** Use a lightweight classifier or the model's first output chunk to generate summary
3. **Fallback:** Have the model emit a structured "understanding" block before responding

### State Machine
```
IDLE → SUBMITTED → THINKING → [TOOL_USE]* → STREAMING → COMPLETE
                      ↓                          ↓
                    ERROR ←─────────────────── ERROR
```

### Streaming Protocol
- Use SSE or WebSocket for real-time token streaming
- Buffer markdown elements that need closing (e.g., don't render partial `**bold`)
- Handle backpressure gracefully

---

## Success Metrics

### Quantitative
- Time to first meaningful content (target: <1s for simple queries)
- Completion rate (users don't abandon mid-response)
- Thinking block expansion rate (are users curious about the reasoning?)

### Qualitative
- User feedback on "intelligence" perception
- Reduction in "I don't think it understood me" complaints
- Increase in complex query submissions (users trust Gail with harder tasks)

---

## Appendix: What We're NOT Doing

### Multi-Stage Checklists (Unless Real)
Fake stages like "Evaluating sources → Considering evidence" that tick on timers create distrust when users notice they don't correlate with actual processing. Only show stages tied to real operations.

### Separate "Deep Research" Mode UI
One consistent UI for all response types. The complexity of the thinking block scales with the complexity of the actual operation — it doesn't transform into a different component.

### Verbose Explanations of Process
Users don't need "I am now going to analyze your question." They need evidence that you understood and results that prove it.

---

## Reference: Claude's Pattern (Anthropic)

Claude uses a single, elegant pattern:
1. Collapsed summary line appears immediately
2. Summary indicates understanding ("Recognized foundational concept...")
3. Checkmark appears when thinking completes
4. Response streams below
5. Thinking is expandable for transparency
6. Same visual container throughout all states

This works because it's **honest** — it shows exactly what's happening, no more and no less. Gail should match this integrity while adding insurance-domain awareness to the summary layer.

---

*End of specification.*
