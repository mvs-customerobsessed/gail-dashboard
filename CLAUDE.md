# Gail Dashboard - Project Instructions

## GailGPT Chat Typography System

The chat responses use a carefully tuned typography system for clean, readable markdown rendering. All styles are in `src/styles/prose.css` under the `.prose` class.

### Design Principles
- Tight, consistent spacing with no awkward gaps
- Streaming and completed messages render identically
- Headers connect tightly to following content (2px bottom margin)
- Serif body text (Source Serif 4), sans-serif headers (Inter)

### Typography Rules

**Headers:**
- h1: 20px font, 24px top margin, 6px bottom margin
- h2: 18px font, 20px top margin, 6px bottom margin
- h3: 16px font, 16px top margin, 4px bottom margin
- h4: 15px font, 12px top margin, 4px bottom margin
- First header in response: no top margin
- All headers: font-weight 600, line-height 1.1

**Paragraphs:**
- 16px font, line-height 1.5
- 0 top margin, 10px bottom margin
- Last paragraph: no bottom margin

**Lists:**
- 0 top margin, 8px bottom margin
- 24px left padding (bullet alignment)
- 4px between list items
- Last item: no bottom margin

**Inline Elements:**
- Bold: font-weight 600, no extra spacing
- Inline code: #F5F3EF background, 2px 6px padding, 4px radius

### Implementation Notes

1. **Streaming Markdown**: Both streaming and completed messages use the same `formatContent()` function from `MessageBubble.jsx`. This prevents visual "jumps" when streaming ends.

2. **CSS Location**: All prose styles are in `src/styles/prose.css` under `.prose`

3. **formatContent()**: Custom markdown parser in `src/components/gailgpt/MessageBubble.jsx` - handles headers, bold, italic, lists, code, links. Not a full markdown parser but covers common patterns.

### When Modifying Typography

- Always test both streaming AND completed message states
- Check that first header has no top margin
- Verify spacing between headers and following paragraphs
- Test with various content: headers, lists, bold terms, mixed content
