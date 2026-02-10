# GailGPT Thinking & Tool Execution Panel

## Feature Spec v1.0

---

## 1. Overview

### What This Is
A dedicated UI panel that displays Gail's reasoning process, tool usage, and research steps in real-time. When Gail is doing *work* beyond simple text generation—searching, researching, calling tools, generating documents—this panel shows the user what's happening under the hood.

### Why It Matters
- **Builds trust**: Users see that Gail is actually doing work, not just spinning
- **Provides feedback**: Long operations (10+ seconds) feel responsive, not broken
- **Transparency**: Users understand what tools are being used and why
- **Professional credibility**: Matches the sophistication expected in financial services

### Design Reference
Inspired by Grok's "DeeperSearch" panel - a two-column layout with progress stepper on the left and streaming thinking content on the right.

---

## 2. When to Show This Panel

Display the Thinking Panel whenever Gail performs:

| Operation | Example |
|-----------|---------|
| Web search | Looking up carrier information, policy details |
| Deep research / extended thinking | Complex questions requiring multiple sources |
| Tool execution | COI Generator, policy lookup, document creation |
| API calls | External system integrations |
| Multi-step workflows | Anything with 2+ distinct steps |
| Any operation > 2-3 seconds | Provides feedback during longer waits |

### Do NOT Show For
- Simple text responses (just stream the text)
- Quick lookups under 2 seconds
- Basic conversation with no tool calls

---

## 3. Layout Structure

### Overall Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────┬───────────────────────────────────────┐ │
│ │   Progress Steps    │         Thinking Content              │ │
│ │      (~180px)       │            (flexible)                 │ │
│ │                     │                                       │ │
│ │  ∴ Deep Research    │   Thinking                            │ │
│ │    2m 15s           │                                       │ │
│ │                     │   Exploring user query                │ │
│ │  ✓ Thinking         │   • The request is about COI...       │ │
│ │  │                  │   • I'm checking policy details...    │ │
│ │  ✓ Searching        │   • Looking up carrier info...        │ │
│ │  │                  │                                       │ │
│ │  ✓ Evaluating       │   Calling COI Generator               │ │
│ │  │  sources         │   • Policy #: ABC-12345               │ │
│ │  │                  │   • Holder: Acme Corp                 │ │
│ │  ◌ Generating       │   • Generating certificate...         │ │
│ │     document        │                                       │ │
│ │                     │                                       │ │
│ ├─────────────────────┴───────────────────────────────────────┤ │
│ │  [↗ Expand] [≡ Details]                                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  🔧 3 tools used  ·  🌐 12 web pages                            │
└─────────────────────────────────────────────────────────────────┘
```

### Placement
- Appears inline within the message flow
- Positioned where Gail's response would normally appear
- Below the user's message that triggered the operation
- Replaced by (or transitions into) the final response when complete

---

## 4. Design Tokens (Color Palette)

Use these colors consistently throughout the panel:

```css
:root {
  /* Panel backgrounds */
  --panel-bg: #FFFEFA;              /* Warm white, slightly lighter than canvas */
  --canvas-bg: #F9F3E6;             /* Main app background (for reference) */
  
  /* Borders */
  --border-color: #E8E4DC;          /* Subtle warm border */
  
  /* Text */
  --text-primary: #2D2A26;          /* Warm charcoal */
  --text-secondary: #7A756D;        /* Warm gray */
  
  /* Step states */
  --step-complete: #5A9A6E;         /* Soft sage green */
  --step-active: #6A9FD4;           /* Soft cornflower blue */
  --step-pending: #C4BFB6;          /* Warm gray */
  
  /* Interactive */
  --accent: #6A9FD4;                /* Soft cornflower */
  --accent-hover: #DEEAF5;          /* Pale cornflower */
  
  /* Brand (logo only) */
  --brand-blue: #0062E2;            /* Gail brand blue - use sparingly */
}
```

---

## 5. Container Styling

### Main Panel Container

```css
.thinking-panel {
  background: #FFFEFA;
  border: 1px solid #E8E4DC;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(45, 42, 38, 0.04);
  padding: 20px;
  max-width: 100%;                  /* Matches content area, ~700-768px */
  margin: 16px 0;
  display: flex;
  flex-direction: column;
}

.thinking-panel-inner {
  display: flex;
  gap: 20px;
}
```

---

## 6. Left Panel - Progress Stepper

### Container
- Width: `180px` fixed
- Flex-shrink: 0

### Header Section

```
[∴ icon] Deep Research
         2m 15s
```

**Styling:**
```css
.stepper-header {
  margin-bottom: 20px;
}

.stepper-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #2D2A26;
}

.stepper-icon {
  width: 20px;
  height: 20px;
  color: #0062E2;               /* Gail brand blue for icon */
}

.stepper-elapsed {
  font-size: 13px;
  color: #7A756D;
  margin-top: 2px;
  margin-left: 28px;            /* Align with title text */
}
```

**Title Variations by Operation:**
| Operation | Title | Icon |
|-----------|-------|------|
| Web search | "Searching" | 🔍 or globe |
| Deep research | "Deep Research" | ∴ or Gail symbol |
| Tool call | "Running [Tool Name]" | 🔧 or tool-specific |
| Document generation | "Generating Document" | 📄 |

**Elapsed Time:**
- Format: `0s`, `45s`, `1m 30s`, `2m 15s`
- Updates every second
- Starts when panel appears

### Step Items

**Step States:**

| State | Icon | Text Style | Description |
|-------|------|------------|-------------|
| Completed | ✓ | Normal, `#2D2A26` | Step finished successfully |
| Active | ◌ (spinner) | Semi-bold, `#2D2A26` | Currently in progress |
| Pending | ○ | Normal, `#7A756D` | Not yet started |

**Step Layout:**
```
  ✓ Thinking
  │
  ✓ Searching
  │
  ◌ Evaluating sources
  │
  ○ Synthesizing
```

**Styling:**
```css
.step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  position: relative;
  padding-bottom: 16px;
}

/* Connecting line */
.step-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 7px;                    /* Center of icon */
  top: 20px;
  bottom: 0;
  width: 1px;
  background: #E8E4DC;
}

.step-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.step-icon--completed {
  color: #5A9A6E;
}

.step-icon--active {
  color: #6A9FD4;
  animation: spin 1s linear infinite;
}

.step-icon--pending {
  color: #C4BFB6;
}

.step-text {
  font-size: 14px;
  color: #2D2A26;
  line-height: 1.4;
}

.step-text--pending {
  color: #7A756D;
}

.step-text--active {
  font-weight: 500;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Example Step Sequences

**Web Search:**
1. Thinking
2. Searching
3. Reading sources
4. Synthesizing

**Deep Research:**
1. Thinking
2. Exploring query
3. Evaluating sources
4. Considering evidence
5. Synthesizing findings

**COI Generator:**
1. Thinking
2. Validating inputs
3. Looking up policy
4. Calling COI Generator
5. Generating document

**Policy Lookup:**
1. Thinking
2. Searching database
3. Retrieving details
4. Formatting response

---

## 7. Right Panel - Thinking Content

### Container
- Flex: 1 (fills remaining width)
- Border-left: `1px solid #E8E4DC`
- Padding-left: `20px`

### Header

```css
.thinking-header {
  font-size: 16px;
  font-weight: 500;
  color: #2D2A26;
  margin-bottom: 12px;
}
```

Text: "Thinking" (always)

### Content Sections

Content streams in as Gail thinks. Organized into sections with headers and bullet points.

**Section Header:**
```css
.content-section-header {
  font-size: 14px;
  font-weight: 600;
  color: #2D2A26;
  margin-top: 16px;
  margin-bottom: 8px;
}

.content-section-header:first-child {
  margin-top: 0;
}
```

**Bullet Points:**
```css
.content-bullets {
  list-style: disc;
  padding-left: 20px;
  margin: 0;
}

.content-bullets li {
  font-size: 14px;
  color: #2D2A26;
  line-height: 1.5;
  margin-bottom: 6px;           /* Tight spacing! */
}

.content-bullets li:last-child {
  margin-bottom: 0;
}
```

**Links & Citations:**
```css
.content-link {
  color: #6A9FD4;
  text-decoration: underline;
}

.content-link:hover {
  color: #5A8FC4;
}

.content-citation {
  color: #6A9FD4;
  text-decoration: underline;
  font-size: 13px;
}
```

### Browsing Indicator

When Gail is browsing a website:

```
🌐 Browsing carrier-website.com for "policy details"
```

```css
.browsing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #2D2A26;
  margin: 12px 0;
  padding: 8px 12px;
  background: #F9F3E6;
  border-radius: 6px;
}

.browsing-icon {
  font-size: 16px;
}

.browsing-url {
  color: #6A9FD4;
  text-decoration: underline;
}

.browsing-query {
  font-weight: 500;
}
```

### Tool Call Display

When Gail calls a tool, show the tool name and key parameters:

```
Calling COI Generator
• Policy #: ABC-12345
• Holder: Acme Corp
• Status: Generating...
```

```css
.tool-call {
  margin: 12px 0;
  padding: 12px;
  background: #F9F3E6;
  border-radius: 6px;
  border-left: 3px solid #6A9FD4;
}

.tool-call-title {
  font-size: 14px;
  font-weight: 600;
  color: #2D2A26;
  margin-bottom: 8px;
}

.tool-call-params {
  list-style: disc;
  padding-left: 20px;
  margin: 0;
}

.tool-call-params li {
  font-size: 13px;
  color: #2D2A26;
  margin-bottom: 4px;
}

.tool-call-params .label {
  font-weight: 500;
}
```

---

## 8. Bottom Bar

### Layout
```
[↗] [≡]                                              
```

Icons on the left, subtle, appear after content.

```css
.panel-footer {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  margin-top: 16px;
  border-top: 1px solid #E8E4DC;
}

.footer-icon {
  width: 20px;
  height: 20px;
  color: #7A756D;
  cursor: pointer;
  transition: color 150ms ease-out;
}

.footer-icon:hover {
  color: #6A9FD4;
}
```

**Icons:**
- `↗` Expand to full screen / popout
- `≡` Toggle detailed view / outline

---

## 9. Sources Summary (Below Panel)

After the operation completes, show a summary below the panel:

```
🔧 3 tools used  ·  🌐 12 web pages
```

### Layout
```css
.sources-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;
  color: #7A756D;
}

.sources-summary:hover {
  color: #6A9FD4;
  cursor: pointer;
}

.favicon-stack {
  display: flex;
}

.favicon-stack img {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  margin-left: -4px;            /* Overlap */
  border: 1px solid #FFFEFA;
}

.favicon-stack img:first-child {
  margin-left: 0;
}

.sources-divider {
  color: #C4BFB6;
}
```

### Expanded State
Clicking the summary expands to show full list of sources/tools used. This could be:
- Inline expansion below
- Modal/drawer with full details
- Tooltip with list

---

## 10. Collapsed State (After Completion)

Once the operation completes, the panel can optionally collapse to a single summary line:

```
┌─────────────────────────────────────────────────────────────────┐
│  ✓ Deep Research completed · 2m 15s · 12 sources     [Expand ↓] │
└─────────────────────────────────────────────────────────────────┘
```

```css
.thinking-panel--collapsed {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.collapsed-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #2D2A26;
}

.collapsed-check {
  color: #5A9A6E;
}

.collapsed-meta {
  color: #7A756D;
}

.collapsed-expand {
  font-size: 13px;
  color: #6A9FD4;
  cursor: pointer;
}
```

**Behavior:**
- Auto-collapse after 3 seconds of completion (optional, configurable)
- Or stay expanded until user scrolls past
- Click to re-expand and see full thinking history

---

## 11. Animations & Transitions

### Panel Appearance
```css
.thinking-panel {
  animation: fadeSlideIn 200ms ease-out;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Step Completion
```css
.step-icon--completed {
  animation: checkIn 150ms ease-out;
}

@keyframes checkIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Content Streaming
```css
.content-bullets li {
  animation: fadeIn 100ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Spinner
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.step-icon--active {
  animation: spin 1s linear infinite;
}
```

### Collapse/Expand
```css
.thinking-panel {
  transition: all 200ms ease-out;
}
```

---

## 12. Component Hierarchy

```
ThinkingPanel
├── ThinkingPanelInner
│   ├── ProgressStepper
│   │   ├── StepperHeader
│   │   │   ├── Icon (Gail symbol or contextual)
│   │   │   ├── Title ("Deep Research", "Searching", etc.)
│   │   │   └── ElapsedTime
│   │   └── StepList
│   │       └── StepItem[] 
│   │           ├── StepIcon (check / spinner / circle)
│   │           └── StepText
│   │
│   └── ThinkingContent
│       ├── ContentHeader ("Thinking")
│       └── ContentBody
│           ├── ContentSection[]
│           │   ├── SectionHeader
│           │   └── BulletList
│           ├── BrowsingIndicator (optional)
│           └── ToolCallDisplay (optional)
│
├── PanelFooter
│   ├── ExpandIcon
│   └── DetailsIcon
│
└── SourcesSummary (appears after completion, below panel)
    ├── FaviconStack
    ├── ToolCount
    └── SourceCount
```

---

## 13. Props & State

### ThinkingPanel Props
```typescript
interface ThinkingPanelProps {
  operationType: 'search' | 'research' | 'tool' | 'document';
  operationTitle: string;           // "Deep Research", "COI Generator", etc.
  steps: Step[];
  thinkingContent: ContentBlock[];
  sources?: Source[];
  toolsUsed?: Tool[];
  isComplete: boolean;
  isCollapsed?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}

interface Step {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending';
}

interface ContentBlock {
  type: 'section' | 'bullets' | 'browsing' | 'toolCall';
  header?: string;
  items?: string[];
  url?: string;
  query?: string;
  toolName?: string;
  toolParams?: Record<string, string>;
}

interface Source {
  url: string;
  favicon?: string;
  title?: string;
}

interface Tool {
  name: string;
  status: 'success' | 'error';
}
```

### State Management
- `elapsedTime`: number (seconds) - increment every second while not complete
- `currentStepIndex`: number - which step is active
- `contentBlocks`: array - append new blocks as they stream in
- `isCollapsed`: boolean - toggle between expanded/collapsed

---

## 14. Integration Notes

### Where It Appears
- Inside `ConversationArea`, inline with messages
- Replaces the simple "Thinking..." indicator for complex operations
- Positioned after the user message that triggered the operation

### Triggering the Panel
The panel should appear when the backend signals:
- A tool call is starting
- Extended thinking is beginning
- Web search is initiated
- Any multi-step operation begins

### Transitioning to Response
When operation completes:
1. Final step shows checkmark
2. Brief pause (300-500ms)
3. Panel collapses OR stays visible
4. Gail's response streams below the panel

### Streaming Content
The `thinkingContent` should update in real-time as Gail thinks:
- New bullets append to current section
- New sections appear with headers
- Tool calls appear when invoked
- Browsing indicators show during web access

---

## 15. Responsive Behavior

### Desktop (1200px+)
- Full two-column layout
- Progress stepper: 180px
- Content: flexible

### Tablet (768px - 1199px)
- Same layout, slightly tighter
- Progress stepper: 160px

### Mobile (< 768px)
- Stack vertically: stepper on top, content below
- Or: hide stepper, show only content with inline step indicators
- Collapsed state is more important here

```css
@media (max-width: 767px) {
  .thinking-panel-inner {
    flex-direction: column;
  }
  
  .progress-stepper {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #E8E4DC;
    padding-bottom: 16px;
    margin-bottom: 16px;
  }
  
  .thinking-content {
    padding-left: 0;
    border-left: none;
  }
}
```

---

## 16. Accessibility

- Use semantic HTML: `<ol>` for steps, `<ul>` for bullets
- ARIA labels for step states: `aria-current="step"` for active
- Spinner should have `aria-label="Loading"`
- Elapsed time should be in an `aria-live="polite"` region
- Ensure sufficient color contrast (all colors pass WCAG AA)
- Keyboard navigable: expand/collapse with Enter/Space

---

## 17. Example Scenarios

### Scenario 1: Web Search
User asks: "What are the current commercial auto insurance rates in Florida?"

```
Steps:                          Content:
─────────                       ─────────
✓ Thinking                      Thinking
│                               
✓ Searching                     Exploring user query
│                               • Looking for current commercial auto rates
◌ Reading sources               • Focus on Florida market
│                               • Will check multiple carriers
○ Synthesizing                  
                                🌐 Browsing insurance-journal.com for 
                                "Florida commercial auto rates 2025"
                                
                                • Found rate increase data from Q4 2024
                                • Multiple carriers reported 8-12% increases
```

### Scenario 2: COI Generator
User asks: "Generate a COI for Acme Corp policy #POL-2025-001"

```
Steps:                          Content:
─────────                       ─────────
✓ Thinking                      Thinking
│                               
✓ Validating inputs             • Request is for Certificate of Insurance
│                               • Policy #: POL-2025-001
✓ Looking up policy             • Holder: Acme Corp
│                               
◌ Generating document           Calling Policy Lookup
                                • Found policy in database
                                • Coverage: General Liability
                                • Status: Active
                                
                                ┌─────────────────────────────┐
                                │ Calling COI Generator       │
                                │ • Policy #: POL-2025-001    │
                                │ • Holder: Acme Corp         │
                                │ • Type: Standard COI        │
                                │ • Status: Generating...     │
                                └─────────────────────────────┘
```

---

## 18. Files to Create

```
components/
├── ThinkingPanel/
│   ├── ThinkingPanel.tsx           # Main container
│   ├── ThinkingPanel.styles.ts     # Styled components or CSS
│   ├── ProgressStepper.tsx         # Left column
│   ├── StepItem.tsx                # Individual step
│   ├── ThinkingContent.tsx         # Right column
│   ├── ContentSection.tsx          # Section with header + bullets
│   ├── BrowsingIndicator.tsx       # URL + query display
│   ├── ToolCallDisplay.tsx         # Tool execution display
│   ├── PanelFooter.tsx             # Bottom actions
│   ├── SourcesSummary.tsx          # Sources chip below panel
│   └── index.ts                    # Exports
```

---

## 19. Summary

This panel transforms long-running operations from a black box into a transparent, trustworthy experience. Users see:

1. **What** Gail is doing (steps on the left)
2. **Why** Gail is doing it (thinking content on the right)
3. **How long** it's taking (elapsed time)
4. **What was used** (sources summary)

The warm color palette and calm animations keep it feeling professional and approachable—never frantic or robotic.
