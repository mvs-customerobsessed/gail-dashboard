# GailGPT UI/UX Design Specification

## 1. Design Philosophy

The GailGPT experience prioritizes **warmth, clarity, and intelligent partnership** over flashy tech aesthetics. It feels like a thoughtful colleague's workspace, not a command terminal. Key principles:

- **Calm over stimulating**: No aggressive animations, minimal visual noise
- **Content-first**: The conversation is the hero, chrome fades into background
- **Confident restraint**: Sophisticated through simplicity, not complexity
- **Human-centered warmth**: Soft colors, generous whitespace, approachable typography

---

## 2. Color Palette

| Element | Color | Notes |
|---------|-------|-------|
| Background (main canvas) | Warm off-white/cream `#FAF9F7` | NOT pure white - critical to the warmth |
| Sidebar background | Slightly darker warm gray `#F5F4F2` | Subtle differentiation |
| User message bubble | Light warm beige/tan `#F0EBE4` | Soft, recedes visually |
| Gail message | No bubble - text on main background | Asymmetric treatment creates visual hierarchy |
| Primary accent | Soft blue `#6BABFF` | Used sparingly - buttons, links, active states |
| Primary accent (light) | Light blue `#CCE0F9` | Hover states, subtle highlights |
| Text primary | Dark warm gray `#1A1A1A` or `#2D2D2D` | Not pure black |
| Text secondary | Medium gray `#6B6B6B` | Timestamps, metadata |
| Code blocks | Light gray background `#F4F4F4` with subtle border | |
| Borders/dividers | Very subtle `#E5E5E5` | Almost invisible, creates structure through negative space |
| Success states | Soft green `#4CAF50` | Confirmations, completion |
| Error states | Soft red `#E57373` | Errors, warnings |

---

## 3. Typography

**Font Stack**: Clean, humanist sans-serif (Inter, Source Sans Pro, or similar)

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Gail response body | 16px | 400 (regular) | Comfortable reading size |
| User message | 16px | 400 | Same as Gail for parity |
| Sidebar conversation titles | 14px | 500 | Truncated with ellipsis |
| Timestamps/metadata | 12-13px | 400 | Subdued gray |
| Headers in responses (H1, H2) | 18-20px | 600 | Used sparingly |
| Code | 14px | Monospace (SF Mono, Fira Code, or Consolas) | |

**Line height**: Generous (1.5-1.6) for readability

**Paragraph spacing**: Clear separation between paragraphs, not cramped

---

## 4. Layout Architecture

GailGPT uses the existing Gail platform sidebar. Chat history is nested within the GailGPT nav item.

```
┌─────────────────────────────────────────────────────────────────┐
│  [Gail Logo]  [←]                    [User Name] [ADMIN] [Exit] │  ← Existing top bar
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│  Existing    │           Conversation Area                      │
│  Platform    │           (centered, max-width ~768px)           │
│  Sidebar     │                                                  │
│  ~160-180px  │     ┌──────────────────────────────────────┐     │
│              │     │  User message (right-aligned bubble) │     │
│  ├ 2026      │     └──────────────────────────────────────┘     │
│  ├ Customers │                                                  │
│  ├ Customer  │     Gail response (left-aligned, no bubble)      │
│  │  Service  │     flows naturally with full width              │
│  ├ Sales     │                                                  │
│  ├ Product   │     ┌──────────────────────────────────────┐     │
│  ├ Real-Time │     │  [Artifact/Output panel - slides in  │     │
│  ├ GailGPT ▼ │     │   from right when present]           │     │
│  │ ├ New Chat│     └──────────────────────────────────────┘     │
│  │ ├ Chat 1  │                                                  │
│  │ ├ Chat 2  │                                                  │
│  │ └ All...  │                                                  │
│  ├ Users     ├──────────────────────────────────────────────────┤
│  └ 2025 OVR  │  ┌────────────────────────────────────────────┐  │
│              │  │  Input area (centered, matches content)    │  │
│  ──────────  │  │  [Attach] [                          ] [↑] │  │
│  Data Entry  │  └────────────────────────────────────────────┘  │
│  Help        │  "Gail can make mistakes..."  (subtle footer)    │
│  Export/Imp  │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

**Critical layout details:**
- Conversation content is **centered** with a max-width (~700-800px), not edge-to-edge
- Generous padding on all sides (40-60px from edges)
- Sidebar is the existing Gail platform nav (not replaced)
- GailGPT expands inline to show nested chat history (see Section 9)
- Empty state shows centered prompt suggestions

---

## 5. Message Styling

### User Messages
- Right-aligned (or slightly right of center)
- Contained in a soft rounded bubble
- Border-radius: 18-20px
- Background: warm beige/tan `#F0EBE4`
- Max-width: ~70-80% of container
- Padding: 12-16px
- No avatar

### Gail Messages
- Left-aligned, no bubble (or very subtle/no background)
- Full available width within content container
- Small Gail logo/icon at start (subtle, 20-24px)
- Text flows naturally
- Padding between messages: 24-32px

**Visual rhythm**: The asymmetry (bubble vs no-bubble) creates clear visual distinction without heavy-handed styling.

---

## 6. Input Area

**Position**: Fixed to bottom, within the centered content area

**Appearance**:
- Rounded rectangle with border-radius: 20-24px
- Subtle border: `1px solid #E5E5E5`
- Subtle shadow on focus (using `#6BABFF` at low opacity)
- Background: white `#FFFFFF`

**Elements**:
- Attachment icon (left, subtle gray, turns `#6BABFF` on hover)
- Multi-line text input (auto-expands up to ~6 lines, then scrolls)
- Send button (right, circular):
  - Empty state: gray `#CCCCCC`
  - Active state: primary blue `#6BABFF`
  - Hover: slightly darker blue

**Placeholder text**: "Message Gail..." (informal, friendly)

**Keyboard behavior**: Enter sends, Shift+Enter for newline

---

## 7. Artifacts & Rich Content

### Inline Code
- Monospace font
- Subtle background `#F4F4F4`
- Rounded corners (4px)
- Padding: 2px 6px

### Code Blocks
- Full-width within message
- Header bar with:
  - Language label (left)
  - Copy button (right, uses `#6BABFF` on hover)
- Syntax highlighting (muted color scheme)
- Horizontal scroll if content overflows
- Border-radius: 8px

### Artifacts (Full Rendered Outputs)
- Slide-in panel from right side OR expand inline below message
- Clear action buttons: "Open in new window" / "Copy" / "Download"
- Title + type indicator in header
- Close button (X) in top right

---

## 8. Loading & Thinking States

**Thinking indicator**: 
- Subtle, animated ellipsis or gentle pulse
- Appears near Gail's avatar/logo area
- Uses `#6BABFF` for any animated elements

**Streaming**: 
- Text appears word-by-word/chunk-by-chunk
- Smooth rendering, no jarring jumps

**Stop button**: 
- Appears during generation
- Allows user to interrupt
- Circular, subtle border

**Important**: No aggressive spinners or loading bars

---

## 9. Sidebar Chat History (Nested Expansion Pattern)

GailGPT exists as one module within the larger Gail platform. Chat history should integrate into the existing sidebar navigation pattern rather than replacing it.

### Structure
```
├── Real-Time
├── GailGPT                      ← Click to expand (chevron indicates expandable)
│   ├── ✨ New Chat              ← Primary action, always first
│   ├── ─────────────            ← Subtle divider line
│   ├── What is insurance?       ← Current/active chat (highlighted)
│   ├── Claims process help      ← Recent chat
│   ├── Policy questions         ← Recent chat
│   └── 📋 All Conversations     ← Opens full history modal
├── Users
├── 2025 OVERVIEW
```

### Behavior Details

**Expansion:**
- GailGPT row has a chevron indicator (like "2026" in existing nav)
- Clicking expands to show nested items
- Stays expanded while user is in GailGPT section
- Collapses when user navigates to different section (optional)

**Nested Items:**
- Show maximum 3-5 recent conversations in sidebar
- "New Chat" is always first, styled as primary action
- Recent chats listed in reverse chronological order (newest first)
- Active/current chat has visual highlight
- "All Conversations" is always last, opens modal for full history

**"All Conversations" Modal:**
- Opens centered modal or slide-in drawer
- Contains full chat history with search functionality
- Date groupings: Today, Yesterday, Previous 7 Days, Previous 30 Days, Older
- Each chat shows: title, preview snippet, timestamp
- Actions on hover: rename, delete (three-dot menu)
- Search bar at top filters conversations

### Styling Details

**GailGPT Parent Row:**
- Same styling as other nav items
- Chevron rotates on expand/collapse
- May show unread indicator/badge if new activity

**New Chat Button (nested):**
- Text: "New Chat" with subtle + icon or ✨
- Text color: `#6BABFF` to indicate primary action
- Hover: background `#CCE0F9` at low opacity

**Chat History Items (nested):**
- Indented ~16-20px from parent
- Font size: 14px
- Color: `#6B6B6B` (secondary text)
- Truncate with ellipsis after ~20 characters
- Full title shown in tooltip on hover
- Hover state: subtle background highlight `#CCE0F9` at 20% opacity

**Active Chat (nested):**
- Left border accent: 2-3px solid `#6BABFF`
- Background: `#CCE0F9` at 15% opacity
- Text color: `#1A1A1A` (primary, not secondary)

**All Conversations Link (nested):**
- Text: "All Conversations" with subtle list/folder icon
- Color: `#6B6B6B`
- Hover: `#6BABFF`

**Divider:**
- Subtle horizontal line `#E5E5E5`
- Margin: 8px 0
- Separates "New Chat" from history list

### All Conversations Modal

```
┌─────────────────────────────────────────────────────────────┐
│  All Conversations                                     [X]  │
├─────────────────────────────────────────────────────────────┤
│  [🔍 Search conversations...]                               │
├─────────────────────────────────────────────────────────────┤
│  TODAY                                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ What is insurance?                           2:34 PM│    │
│  │ Insurance is a financial protection system...       │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Claims process help                          11:20 AM│   │
│  │ To file a claim, you'll need to...                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  YESTERDAY                                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Policy renewal questions                     4:15 PM│    │
│  │ Your policy renewal date is...                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  PREVIOUS 7 DAYS                                            │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

**Modal Styling:**
- Width: ~500-600px (or 90% on mobile)
- Max-height: 70vh with scroll
- Background: white
- Border-radius: 12px
- Shadow: subtle drop shadow
- Overlay: dark semi-transparent backdrop

**Conversation Cards in Modal:**
- Background: `#FAF9F7`
- Border: 1px solid `#E5E5E5`
- Border-radius: 8px
- Padding: 12px 16px
- Hover: border color `#6BABFF`, subtle shadow
- Title: 16px, font-weight 500, `#1A1A1A`
- Preview: 14px, `#6B6B6B`, max 2 lines, truncate
- Timestamp: 12px, `#6B6B6B`, right-aligned
- Three-dot menu appears on hover (rename, delete)

---

## 10. Micro-interactions & Polish

**Hover states**: Subtle background shifts using `#CCE0F9`, never jarring

**Transitions**: 150-200ms ease-out for most transitions

**Feedback buttons**: Thumbs up/down appear on hover below Gail's messages

**Copy buttons**: Appear on hover for code blocks and messages

**Focus states**: Visible ring using `#6BABFF` at 30% opacity (for accessibility)

**Scroll behavior**: Smooth scrolling, auto-scrolls to bottom on new messages

**Button interactions**:
- Subtle scale (1.02) on hover for primary buttons
- Quick color transition on state changes

---

## 11. Empty/New Conversation State

Centered in main area:

1. **Gail logo** (subtle, appropriately sized)
2. **Welcome text**: "How can I help you today?" or similar warm greeting
3. **Suggested prompts**: 3-4 prompt chips/cards
   - Rounded pills or subtle cards
   - Light border or background
   - Hover state uses `#CCE0F9`
4. These fade/slide away when user starts typing

---

## 12. What NOT to Do

- ❌ Pure white backgrounds (feels clinical)
- ❌ Aggressive gradients or glassmorphism
- ❌ Heavy drop shadows
- ❌ Identical styling for user/assistant messages
- ❌ Robotic language ("Processing your request...")
- ❌ Cluttered toolbars with many icons
- ❌ Flashy animations or bouncing elements
- ❌ Dark mode as default (light mode conveys warmth)
- ❌ Tiny text or cramped layouts
- ❌ Full-width content that forces long horizontal eye travel
- ❌ Overuse of the accent blue - it should be used sparingly for emphasis

---

## 13. Responsive Behavior

### Desktop (1200px+)
- Full sidebar visible
- Conversation area centered with generous margins
- Artifacts can open in side panel

### Tablet (768px - 1199px)
- Sidebar collapses to icons or hamburger menu
- Conversation area expands
- Artifacts open as modal overlay

### Mobile (< 768px)
- Sidebar hidden, accessible via hamburger
- Full-width conversation with appropriate padding (16-20px)
- Input area sticks to bottom
- Artifacts open full-screen

---

## 14. Component Summary

### Primary Components to Build
1. `GailGPTNavSection` - Expandable nav item with nested chat history
2. `ChatHistoryItem` - Individual chat link in sidebar (nested)
3. `AllConversationsModal` - Full history modal with search
4. `ConversationArea` - Centered message container
5. `UserMessage` - Bubble-styled user message
6. `GailMessage` - Clean, no-bubble assistant response
7. `MessageInput` - Bottom-fixed input with attachment and send
8. `CodeBlock` - Syntax-highlighted code with copy button
9. `ArtifactPanel` - Slide-in panel for rich outputs
10. `EmptyState` - Welcome screen with suggested prompts
11. `LoadingIndicator` - Subtle thinking/streaming state
12. `ConversationCard` - Chat preview card used in modal

### Design Tokens to Define
```css
:root {
  /* Colors */
  --color-bg-primary: #FAF9F7;
  --color-bg-sidebar: #F5F4F2;
  --color-bg-user-message: #F0EBE4;
  --color-accent-primary: #6BABFF;
  --color-accent-light: #CCE0F9;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B6B6B;
  --color-border: #E5E5E5;
  --color-code-bg: #F4F4F4;
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-body: 16px;
  --font-size-small: 14px;
  --font-size-xs: 12px;
  --line-height: 1.6;
  
  /* Spacing */
  --spacing-message: 24px;
  --spacing-padding: 16px;
  --content-max-width: 768px;
  --sidebar-width: 280px;
  
  /* Borders */
  --border-radius-message: 20px;
  --border-radius-input: 24px;
  --border-radius-button: 8px;
  
  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 200ms ease-out;
}
```

---

## 15. The Feeling We Want

GailGPT's UI should feel like:
- A clean notebook on a warm wooden desk
- A conversation with a thoughtful expert who genuinely wants to help
- Confident simplicity that doesn't need to prove itself
- Respectful of the user's attention and time
- Professional yet approachable for financial services users

**Not like**:
- A sci-fi terminal
- A corporate enterprise dashboard
- A gamified app seeking engagement
- A cold, clinical tool

---

## Implementation Notes for Claude Code

When implementing this specification:

1. **Start with the design tokens** - Define CSS custom properties first
2. **Build mobile-first** - Then enhance for larger screens
3. **Message styling is critical** - The asymmetry between user/Gail messages defines the experience
4. **Test the warmth** - The off-white background and warm tans should feel inviting, not stark
5. **Accent color restraint** - Use `#6BABFF` only for interactive elements and emphasis, not decoration
6. **Whitespace is a feature** - Don't fill every pixel; let content breathe
7. **Smooth transitions** - Every state change should have a subtle, quick transition

Replace all instances of "Claude" with "Gail" in any UI copy, and use the Gail logo wherever a brand mark appears.
