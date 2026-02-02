import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Loader2, Check, AlertCircle, Wrench } from 'lucide-react';
import { colors, transitions } from './designTokens';

// Status types: 'thinking' | 'tool_use' | 'streaming' | 'complete' | 'error'

const styles = {
  container: {
    backgroundColor: colors.background,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
    animation: 'fadeSlideIn 150ms ease-out',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    transition: transitions.fast,
  },
  indicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    flexShrink: 0,
  },
  spinner: {
    color: '#D4A853', // warm amber during processing
    animation: 'spin 1s linear infinite',
  },
  checkmark: {
    color: colors.success,
  },
  errorIcon: {
    color: colors.error,
  },
  summaryText: {
    flex: 1,
    fontSize: '14px',
    fontWeight: 500,
    color: colors.textPrimary,
    lineHeight: 1.4,
  },
  summaryTextStreaming: {
    color: colors.textSecondary,
  },
  chevron: {
    color: colors.textSecondary,
    transition: 'transform 150ms ease-out',
    flexShrink: 0,
  },
  chevronExpanded: {
    transform: 'rotate(90deg)',
  },
  contentWrapper: {
    overflow: 'hidden',
    transition: 'max-height 200ms ease-out, opacity 150ms ease-out',
  },
  content: {
    padding: '0 14px 14px',
    borderTop: `1px solid ${colors.border}`,
  },
  thinkingText: {
    fontSize: '13px',
    lineHeight: 1.6,
    color: colors.textSecondary,
    whiteSpace: 'pre-wrap',
    maxHeight: '200px',
    overflowY: 'auto',
    paddingTop: '12px',
  },
  toolCallsSection: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  toolCall: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    backgroundColor: colors.backgroundSidebar,
    borderRadius: '8px',
    fontSize: '13px',
  },
  toolIcon: {
    width: '16px',
    height: '16px',
    flexShrink: 0,
  },
  toolName: {
    flex: 1,
    color: colors.textPrimary,
    fontWeight: 500,
  },
  toolStatus: {
    display: 'flex',
    alignItems: 'center',
  },
  toolSpinner: {
    color: '#D4A853',
    animation: 'spin 1s linear infinite',
  },
  toolCheck: {
    color: colors.success,
  },
  toolError: {
    color: colors.error,
  },
  streamingDot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    backgroundColor: '#D4A853',
    borderRadius: '50%',
    marginLeft: '6px',
    animation: 'pulse 1s ease-in-out infinite',
  },
};

// Extract first meaningful line from thinking content for summary
function extractSummary(thinking, toolCalls = [], status) {
  // If we have an active tool call, show that
  const activeTool = toolCalls.find(t => t.status === 'in_progress');
  if (activeTool) {
    const toolName = formatToolName(activeTool.name);
    return `${toolName}...`;
  }

  // If thinking content exists, extract first line
  if (thinking && thinking.trim()) {
    const firstLine = thinking.trim().split('\n')[0];
    // Truncate if too long
    if (firstLine.length > 80) {
      return firstLine.substring(0, 77) + '...';
    }
    return firstLine;
  }

  // Fallback placeholders based on status
  switch (status) {
    case 'thinking':
      return 'Thinking...';
    case 'tool_use':
      return 'Working...';
    case 'streaming':
      return 'Preparing response...';
    case 'complete':
      return 'Completed';
    case 'error':
      return 'An error occurred';
    default:
      return 'Processing...';
  }
}

// Format tool name for display
function formatToolName(name) {
  if (!name) return 'Running tool';
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function ThinkingBlock({
  status = 'thinking', // 'thinking' | 'tool_use' | 'streaming' | 'complete' | 'error'
  thinking = '',
  toolCalls = [],
  summary: customSummary = null,
  error = null,
  defaultExpanded = false,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef(null);

  // Auto-collapse on completion (after a brief delay to show the transition)
  useEffect(() => {
    if (status === 'complete' && isExpanded) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const isActive = status === 'thinking' || status === 'tool_use' || status === 'streaming';
  const isComplete = status === 'complete';
  const isError = status === 'error';

  // Derive summary from thinking content or custom summary
  const displaySummary = customSummary || extractSummary(thinking, toolCalls, status);

  // Render the status indicator
  const renderIndicator = () => {
    if (isError) {
      return <AlertCircle size={18} style={styles.errorIcon} />;
    }
    if (isComplete) {
      return <Check size={18} style={styles.checkmark} />;
    }
    return <Loader2 size={18} style={styles.spinner} />;
  };

  // Render tool call item
  const renderToolCall = (tool, index) => {
    const name = formatToolName(tool.name);
    const isToolComplete = tool.status === 'complete';
    const isToolError = tool.status === 'error';

    return (
      <div key={tool.id || index} style={styles.toolCall}>
        <Wrench size={14} style={{ ...styles.toolIcon, color: colors.textSecondary }} />
        <span style={styles.toolName}>{name}</span>
        <span style={styles.toolStatus}>
          {isToolError ? (
            <AlertCircle size={14} style={styles.toolError} />
          ) : isToolComplete ? (
            <Check size={14} style={styles.toolCheck} />
          ) : (
            <Loader2 size={14} style={styles.toolSpinner} />
          )}
        </span>
      </div>
    );
  };

  // Check if we have content to show
  const hasContent = thinking || toolCalls.length > 0 || error;

  return (
    <div style={styles.container}>
      <button
        style={styles.header}
        onClick={handleToggle}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.backgroundSidebar}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <span style={styles.indicator}>
          {renderIndicator()}
        </span>

        <span style={{
          ...styles.summaryText,
          ...(isActive ? styles.summaryTextStreaming : {}),
        }}>
          {displaySummary}
          {isActive && <span style={styles.streamingDot} />}
        </span>

        {hasContent && (
          <ChevronRight
            size={16}
            style={{
              ...styles.chevron,
              ...(isExpanded ? styles.chevronExpanded : {}),
            }}
          />
        )}
      </button>

      {/* Expandable content */}
      {hasContent && (
        <div
          style={{
            ...styles.contentWrapper,
            maxHeight: isExpanded ? '400px' : '0',
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <div style={styles.content} ref={contentRef}>
            {/* Thinking text */}
            {thinking && (
              <div style={styles.thinkingText}>
                {thinking}
              </div>
            )}

            {/* Tool calls */}
            {toolCalls.length > 0 && (
              <div style={styles.toolCallsSection}>
                {toolCalls.map((tool, idx) => renderToolCall(tool, idx))}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div style={{ ...styles.thinkingText, color: colors.error }}>
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
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
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
