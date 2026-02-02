import ThinkingBlock from './ThinkingBlock';
import { colors, typography } from './designTokens';

const styles = {
  // User message container - right aligned, no avatar
  containerUser: {
    display: 'flex',
    justifyContent: 'flex-end',
    maxWidth: '100%',
  },
  // Assistant message container - left aligned with logo
  containerAssistant: {
    display: 'flex',
    gap: '10px',
    maxWidth: '100%',
    alignItems: 'flex-start',
  },
  gailLogo: {
    width: '22px',
    height: '22px',
    borderRadius: '4px',
    flexShrink: 0,
    marginTop: '2px',
  },
  contentUser: {
    maxWidth: '75%',
  },
  contentAssistant: {
    flex: 1,
    maxWidth: '100%',
  },
  bubbleUser: {
    padding: '12px 16px',
    borderRadius: '18px',
    borderTopRightRadius: '4px',
    backgroundColor: '#F0EAE0',
    color: '#2D2A26',
    fontSize: typography.body.size,
    lineHeight: typography.body.lineHeight,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  bubbleAssistant: {
    fontSize: typography.body.size,
    lineHeight: typography.body.lineHeight,
    color: colors.textPrimary,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  filesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '8px',
  },
  fileChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    backgroundColor: 'rgba(45, 42, 38, 0.08)',
    borderRadius: '6px',
    fontSize: '12px',
    color: colors.textPrimary,
  },
  thinkingWrapper: {
    marginBottom: '12px',
  },
  markdownContent: {
    '& p': {
      margin: '0 0 12px 0',
      lineHeight: 1.6,
    },
    '& p:last-child': {
      marginBottom: 0,
    },
    '& ul, & ol': {
      margin: '4px 0 12px 0',
      paddingLeft: '20px',
      lineHeight: 1.4,
    },
    '& li': {
      marginBottom: '4px',
      paddingLeft: '4px',
    },
    '& li:last-child': {
      marginBottom: 0,
    },
    '& code': {
      backgroundColor: colors.backgroundCode,
      padding: '2px 6px',
      borderRadius: '4px',
      fontFamily: typography.fontFamilyMono,
      fontSize: '13px',
    },
    '& pre': {
      backgroundColor: '#1E1E1E',
      color: '#F8F8F8',
      padding: '14px 16px',
      borderRadius: '8px',
      overflow: 'auto',
      margin: '12px 0',
      fontSize: '13px',
      lineHeight: 1.5,
    },
    '& pre code': {
      backgroundColor: 'transparent',
      padding: 0,
    },
    '& a': {
      color: colors.primary,
      textDecoration: 'none',
    },
    '& a:hover': {
      textDecoration: 'underline',
    },
    '& strong': {
      fontWeight: 600,
    },
    '& h1, & h2, & h3': {
      fontWeight: 600,
      marginTop: '16px',
      marginBottom: '6px',
      lineHeight: 1.3,
    },
    '& h1:first-child, & h2:first-child, & h3:first-child': {
      marginTop: 0,
    },
    '& h1': { fontSize: '20px' },
    '& h2': { fontSize: '18px' },
    '& h3': { fontSize: '16px' },
    '& blockquote': {
      borderLeft: `3px solid ${colors.border}`,
      paddingLeft: '14px',
      margin: '12px 0',
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    '& table': {
      borderCollapse: 'collapse',
      width: '100%',
      margin: '12px 0',
    },
    '& th, & td': {
      border: `1px solid ${colors.border}`,
      padding: '8px 12px',
      textAlign: 'left',
    },
    '& th': {
      backgroundColor: colors.backgroundSidebar,
      fontWeight: 600,
    },
  },
};

// Simple markdown-like formatting (not a full parser)
// Exported for use in streaming responses
export function formatContent(content) {
  if (!content) return '';

  // First, convert definition-style lists: **Term** - Description
  // These are consecutive lines that start with **bold** followed by " - "
  // Convert them to proper bullet list items BEFORE other processing
  let formatted = content.replace(
    /^(\*\*[^*]+\*\*\s*-\s*.+)$/gm,
    '- $1'
  );

  // Also handle **Term:** Description format (colon style)
  // Convert to bullet list items
  formatted = formatted.replace(
    /^(\*\*[^*]+\*\*:\s*.+)$/gm,
    '- $1'
  );

  // Also handle numbered lists: 1. **Term** - Description
  formatted = formatted.replace(
    /^(\d+)\.\s+(\*\*[^*]+\*\*.*)$/gm,
    '<oli>$2</oli>'
  );

  // Convert markdown-style formatting
  formatted = formatted
    // Headers (must be processed first)
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    // Bold (before italic to handle **text** correctly)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Nested lists - indented items (2+ spaces or tab before -)
    .replace(/^[ \t]{2,}- (.*?)$/gm, '<nested-li>$1</nested-li>')
    // Top-level lists - convert markdown lists to HTML
    .replace(/^- (.*?)$/gm, '<li>$1</li>');

  // Process nested lists: wrap consecutive <nested-li> in <ul> and attach to previous <li>
  formatted = formatted.replace(/<\/li>([\s\n]*)(<nested-li>.*?<\/nested-li>[\s\n]*)+/gs, (match) => {
    const nestedItems = match.match(/<nested-li>.*?<\/nested-li>/gs) || [];
    const nestedHtml = nestedItems
      .map(item => item.replace('<nested-li>', '<li>').replace('</nested-li>', '</li>'))
      .join('');
    return `<ul>${nestedHtml}</ul></li>`;
  });

  // Clean up any remaining nested-li tags (standalone nested items)
  formatted = formatted.replace(/<nested-li>/g, '<li>').replace(/<\/nested-li>/g, '</li>');

  // Wrap consecutive <li> elements in <ul>, even if separated by blank lines
  // This regex matches <li> elements separated by any whitespace/newlines
  formatted = formatted.replace(/(<li>.*?<\/li>[\s\n]*)+/gs, (match) => {
    // Extract just the li elements, removing all whitespace between them
    const items = match.match(/<li>.*?<\/li>/gs) || [];
    return `<ul>${items.join('')}</ul>`;
  });

  // Wrap consecutive <oli> elements in <ol> (ordered list)
  formatted = formatted.replace(/(<oli>.*?<\/oli>[\s\n]*)+/gs, (match) => {
    const items = match.match(/<oli>.*?<\/oli>/gs) || [];
    const cleanedItems = items.join('').replace(/<oli>/g, '<li>').replace(/<\/oli>/g, '</li>');
    return `<ol>${cleanedItems}</ol>`;
  });

  // Convert line breaks to paragraphs for better spacing
  // Split by double newlines for paragraphs
  const blocks = formatted.split(/\n\n+/);
  formatted = blocks
    .map(block => block.trim())
    .filter(block => block)
    .map(block => {
      // Don't wrap if already an HTML block element
      if (block.startsWith('<h') || block.startsWith('<ul') || block.startsWith('<ol') || block.startsWith('<pre') || block.startsWith('<p')) {
        return block;
      }
      // Replace single newlines with <br> within a paragraph
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');

  return formatted;
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;
  const hasFiles = message.files && message.files.length > 0;

  // User message - no avatar, right aligned
  if (isUser) {
    return (
      <div style={styles.containerUser}>
        <div style={styles.contentUser}>
          {/* File attachments */}
          {hasFiles && (
            <div style={styles.filesContainer}>
              {message.files.map((file, idx) => (
                <span key={idx} style={styles.fileChip}>
                  {file.name || file}
                </span>
              ))}
            </div>
          )}

          {/* Message content */}
          {message.content && (
            <div style={styles.bubbleUser}>
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant message - Gail logo on left, aligned with text
  return (
    <div style={styles.containerAssistant}>
      <img
        src="/gail-icon.png"
        alt="Gail"
        style={styles.gailLogo}
      />

      <div style={styles.contentAssistant}>
        {/* Only show thinking block when there are REAL tool calls
            Don't show for simple questions - the thinking text alone isn't useful */}
        {hasToolCalls && (
          <div style={styles.thinkingWrapper}>
            <ThinkingBlock
              status="complete"
              thinking={message.thinking || ''}
              toolCalls={(message.toolCalls || []).map(tc => ({
                ...tc,
                status: tc.status || 'complete',
              }))}
            />
          </div>
        )}

        {/* Message content */}
        {message.content && (
          <div style={styles.bubbleAssistant}>
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
