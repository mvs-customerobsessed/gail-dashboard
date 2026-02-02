import { useState, useRef, useEffect, useCallback } from 'react';
import { Paperclip, StopCircle, AlertCircle, X, ArrowUp, Clock, Plus, FileText, Search, ClipboardList, CheckCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ThinkingBlock from './ThinkingBlock';
import { colors, typography, transitions } from './designTokens';

// Action cards data (3x2 grid)
const actionCards = [
  { icon: FileText, label: 'Generate Proposals', description: 'Have Gail build custom policies for your customers' },
  { icon: Search, label: 'Analyze Documents', description: 'Have Gail analyze files and extract key insights' },
  { icon: ClipboardList, label: 'Complete Forms', description: 'Have Gail auto-complete frequently used forms' },
  { icon: Search, label: 'Review Claims', description: 'Have Gail analyze and review different claims' },
  { icon: ClipboardList, label: 'Compare Coverages', description: 'Have Gail compare and analyze coverages' },
  { icon: CheckCircle, label: 'Qualify Leads', description: 'Have Gail review and analyze your contacts list' },
];

// Dynamic greetings based on time of day
const greetings = {
  morning: [
    "Coffee and Gail time?",
    "Good morning! Ready to get started?",
    "Let's make today productive",
    "Morning! What can I help with?",
  ],
  afternoon: [
    "Good afternoon! How can I help?",
    "What are we working on today?",
    "Ready when you are",
    "Let's tackle something together",
  ],
  evening: [
    "Good evening! Still grinding?",
    "Wrapping up the day?",
    "Evening! What do you need?",
    "Let's finish strong",
  ],
  night: [
    "Working late? I'm here to help",
    "Burning the midnight oil?",
    "Night owl mode activated",
    "Let's get this done",
  ],
};

const getGreeting = () => {
  const hour = new Date().getHours();
  let timeOfDay;
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';

  const options = greetings[timeOfDay];
  return options[Math.floor(Math.random() * options.length)];
};

const styles = {
  // Container
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: colors.background,
    fontFamily: typography.fontFamily,
  },

  // Welcome View
  welcomeContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: '15vh',
    padding: '15vh 24px 40px',
    overflowY: 'auto',
  },
  welcomeContent: {
    width: '100%',
    maxWidth: '720px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  // Greeting row - icon and text inline
  greetingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '32px',
  },
  greetingIcon: {
    width: '36px',
    height: '36px',
    flexShrink: 0,
  },
  greetingText: {
    fontSize: '32px',
    fontWeight: 400,
    color: '#2D2A26',
    letterSpacing: '-0.3px',
    fontFamily: "Georgia, 'Times New Roman', Times, serif",
  },

  // Welcome Input - Claude-style two-row layout
  welcomeInputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 20px 16px 20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
    transition: transitions.fast,
    width: '100%',
    outline: 'none',
  },
  welcomeInputWrapperFocused: {
    borderColor: 'rgba(0, 0, 0, 0.12)',
    boxShadow: '0 2px 16px rgba(0, 0, 0, 0.08)',
    outline: 'none',
  },
  welcomeTextArea: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '16px',
    lineHeight: 1.5,
    resize: 'none',
    fontFamily: 'inherit',
    color: colors.textPrimary,
    minHeight: '28px',
    maxHeight: '120px',
    marginBottom: '16px',
    width: '100%',
  },
  welcomeInputControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '4px',
  },
  welcomeInputControlsLeft: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  welcomeIconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#7A756D',
    transition: 'all 150ms ease-out',
    outline: 'none',
  },
  welcomeSendButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    border: 'none',
    backgroundColor: '#6A9FD4',
    borderRadius: '10px',
    cursor: 'pointer',
    color: '#FFFFFF',
    transition: 'all 150ms ease-out',
    outline: 'none',
  },
  welcomeSendButtonActive: {
    backgroundColor: '#6A9FD4',
  },
  welcomeSendButtonDisabled: {
    backgroundColor: '#D4D0C8',
    cursor: 'not-allowed',
  },

  // Action Cards (3x2 grid)
  actionCardsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginTop: '24px',
    width: '100%',
  },
  actionCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '16px',
    backgroundColor: 'transparent',
    border: '1px solid #E8E4DC',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 150ms ease-out',
  },
  actionCardIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    backgroundColor: '#F5F3EF',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  actionCardIcon: {
    width: '18px',
    height: '18px',
    color: '#7A756D',
  },
  actionCardLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2D2A26',
    marginBottom: '4px',
    textAlign: 'left',
  },
  actionCardDescription: {
    fontSize: '13px',
    fontWeight: 400,
    color: '#7A756D',
    lineHeight: 1.4,
    textAlign: 'left',
  },

  // Chat View - Centered like ChatGPT/Claude
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  messagesInner: {
    maxWidth: '768px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
  // Streaming response - like an assistant message but with thinking at top
  streamingResponse: {
    display: 'flex',
    gap: '10px',
    maxWidth: '100%',
    alignItems: 'flex-start',
  },
  streamingResponseAvatar: {
    width: '22px',
    height: '22px',
    borderRadius: '4px',
    flexShrink: 0,
    marginTop: '2px',
  },
  streamingResponseContent: {
    flex: 1,
    maxWidth: '100%',
  },
  streamingResponseText: {
    fontSize: '16px',
    lineHeight: 1.6,
    color: colors.textPrimary,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: colors.errorBg,
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
    color: colors.error,
  },

  // Chat Input Area
  inputContainer: {
    padding: '0 24px 16px',
    borderTop: 'none',
    backgroundColor: colors.background,
    display: 'flex',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inputInner: {
    width: '100%',
    maxWidth: '768px',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E5E5E5',
    boxShadow: 'none',
    transition: transitions.fast,
    width: '100%',
  },
  inputWrapperFocused: {
    borderColor: '#D0D0D0',
    boxShadow: 'none',
  },
  textArea: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '15px',
    lineHeight: 1.5,
    resize: 'none',
    maxHeight: '160px',
    fontFamily: 'inherit',
    color: colors.textPrimary,
    minHeight: '24px',
  },
  attachButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#B0B0B0',
    transition: transitions.fast,
  },
  // Active state - warm accent color when input has content
  sendButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: '#D4A853',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#FFFFFF',
    transition: 'all 200ms ease-out',
  },
  // Disabled state - muted, recedes into background
  sendButtonDisabled: {
    backgroundColor: '#E8E8E8',
    color: '#B0B0B0',
    cursor: 'default',
  },
  stopButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: '1px solid #E5E5E5',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#C97373',
    transition: transitions.fast,
  },
  filePreview: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px',
  },
  fileChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    backgroundColor: colors.backgroundSidebar,
    borderRadius: '6px',
    fontSize: '12px',
    color: colors.textPrimary,
  },
  fileChipRemove: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: colors.textSecondary,
    padding: 0,
  },
  footer: {
    textAlign: 'center',
    padding: '8px 24px 20px',
    fontSize: '12px',
    color: colors.textSecondary,
    backgroundColor: colors.background,
    flexShrink: 0,
  },
};

// Welcome View Component
function WelcomeView({ onSend, input, setInput, files, setFiles, fileInputRef }) {
  const [isFocused, setIsFocused] = useState(false);
  const [greeting] = useState(() => getGreeting());
  const textAreaRef = useRef(null);
  const canSend = input.trim() || files.length > 0;

  const handleSubmit = () => {
    if (!canSend) return;
    onSend(input, files);
    setInput('');
    setFiles([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChipClick = (chip) => {
    setInput(chip.label);
    textAreaRef.current?.focus();
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div style={styles.welcomeContainer}>
      <div style={styles.welcomeContent}>
        {/* Greeting Row - Icon and text inline */}
        <div style={styles.greetingRow}>
          <img
            src="/gail-icon.png"
            alt="Gail"
            style={styles.greetingIcon}
          />
          <span style={styles.greetingText}>{greeting}</span>
        </div>

        {/* File previews - above input */}
        {files.length > 0 && (
          <div style={{ ...styles.filePreview, marginBottom: '8px', width: '100%' }}>
            {files.map((file, idx) => (
              <div key={idx} style={styles.fileChip}>
                <Paperclip size={12} />
                <span>{file.name}</span>
                <button
                  style={styles.fileChipRemove}
                  onClick={() => handleRemoveFile(idx)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Box - Claude-style two-row layout */}
        <div style={{
          ...styles.welcomeInputWrapper,
          ...(isFocused ? styles.welcomeInputWrapperFocused : {}),
        }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const selectedFiles = Array.from(e.target.files);
              setFiles(prev => [...prev, ...selectedFiles]);
              e.target.value = '';
            }}
            accept=".pdf,.doc,.docx"
            multiple
            style={{ display: 'none' }}
          />

          {/* Textarea at top */}
          <textarea
            ref={textAreaRef}
            style={styles.welcomeTextArea}
            placeholder="How can I help you today?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={1}
          />

          {/* Controls at bottom */}
          <div style={styles.welcomeInputControls}>
            <div style={styles.welcomeInputControlsLeft}>
              <button
                style={styles.welcomeIconButton}
                onClick={() => fileInputRef.current?.click()}
                title="Attach files"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(106, 159, 212, 0.15)';
                  e.currentTarget.style.color = '#6A9FD4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#7A756D';
                }}
              >
                <Plus size={20} />
              </button>
              <button
                style={{ ...styles.welcomeIconButton, color: '#6A9FD4' }}
                title="Recent"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(106, 159, 212, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Clock size={20} />
              </button>
            </div>

            <button
              style={{
                ...styles.welcomeSendButton,
                ...(canSend ? styles.welcomeSendButtonActive : {}),
              }}
              onClick={handleSubmit}
              disabled={!canSend}
              title="Send message"
              onMouseEnter={(e) => canSend && (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => canSend && (e.currentTarget.style.opacity = '1')}
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>

        {/* Action Cards */}
        <div style={styles.actionCardsContainer}>
          {actionCards.map(({ icon: Icon, label, description }) => (
            <button
              key={label}
              style={styles.actionCard}
              onClick={() => handleChipClick({ label })}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FAFAFA';
                e.currentTarget.style.borderColor = '#6A9FD4';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#E8E4DC';
              }}
            >
              <div style={styles.actionCardIconWrapper}>
                <Icon size={18} strokeWidth={1.5} style={styles.actionCardIcon} />
              </div>
              <span style={styles.actionCardLabel}>{label}</span>
              <span style={styles.actionCardDescription}>{description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple content formatter for streaming responses
function MessageContent({ content }) {
  if (!content) return null;

  // Basic markdown-like formatting
  const formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#F5F3EF;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px">$1</code>')
    .replace(/\n/g, '<br>');

  return (
    <div
      dangerouslySetInnerHTML={{ __html: formatted }}
      style={{ lineHeight: 1.6 }}
    />
  );
}

// Chat View Component
function ChatView({
  messages,
  isStreaming,
  currentThinking,
  currentToolCalls,
  error,
  isThinkingComplete,
  onSend,
  onStop,
  input,
  setInput,
  files,
  setFiles,
  fileInputRef,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef(null);
  const textAreaRef = useRef(null);

  // Derive ThinkingBlock status from streaming state
  const getThinkingStatus = () => {
    if (error) return 'error';
    if (isThinkingComplete) return 'complete';
    if (currentToolCalls.length > 0) return 'tool_use';
    return 'complete';
  };

  // Only show ThinkingBlock when ACTIVELY streaming with real content
  // Once complete, the thinking is part of the message (shown in MessageBubble)
  // This prevents duplicate ThinkingBlock after completion
  const hasRealContent = currentToolCalls.length > 0 || (currentThinking && currentThinking.trim().length > 0);
  const showThinkingBlock = hasRealContent && isStreaming && !isThinkingComplete;

  // Smart scroll: completely disable auto-scroll when user scrolls up
  // Show "Jump to bottom" button instead of fighting them
  const messagesContainerRef = useRef(null);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);
  const lastScrollTop = useRef(0);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const currentScrollTop = container.scrollTop;
    const maxScroll = container.scrollHeight - container.clientHeight;
    const distanceFromBottom = maxScroll - currentScrollTop;

    // User scrolled UP - disable auto-scroll
    if (currentScrollTop < lastScrollTop.current && distanceFromBottom > 50) {
      setUserHasScrolledUp(true);
    }

    // User scrolled to bottom - re-enable auto-scroll
    if (distanceFromBottom < 20) {
      setUserHasScrolledUp(false);
    }

    lastScrollTop.current = currentScrollTop;
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUserHasScrolledUp(false);
  }, []);

  // No auto-scroll - user controls scrolling manually
  // Use "Jump to bottom" button when you want to go to the end

  // Reset scroll state when new conversation starts
  useEffect(() => {
    if (messages.length === 0) {
      setUserHasScrolledUp(false);
    }
  }, [messages.length]);

  // Auto-resize textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    if (!input.trim() && files.length === 0) return;
    if (isStreaming) return;

    onSend(input, files);
    setInput('');
    setFiles([]);
  }, [input, files, isStreaming, onSend, setInput, setFiles]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleRemoveFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, [setFiles]);

  const canSend = (input.trim() || files.length > 0) && !isStreaming;

  return (
    <div style={styles.container}>
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        style={styles.messagesContainer}
        onScroll={handleScroll}
      >
        <div style={styles.messagesInner}>
          {messages.map((message, idx) => {
            const isLastMessage = idx === messages.length - 1;
            const isStreamingThisMessage = isLastMessage && isStreaming && message.role === 'assistant';

            // For the streaming assistant message, render with ThinkingBlock at top
            if (isStreamingThisMessage) {
              return (
                <div key={idx} style={styles.streamingResponse}>
                  <img
                    src="/gail-icon.png"
                    alt="Gail"
                    style={styles.streamingResponseAvatar}
                  />
                  <div style={styles.streamingResponseContent}>
                    {/* ThinkingBlock at TOP - like Claude/ChatGPT */}
                    {(currentThinking || currentToolCalls.length > 0) && (
                      <div style={{ marginBottom: '12px' }}>
                        <ThinkingBlock
                          status={getThinkingStatus()}
                          thinking={currentThinking}
                          toolCalls={currentToolCalls.map(tc => ({
                            ...tc,
                            status: tc.status === 'complete' ? 'complete' : tc.status === 'error' ? 'error' : 'in_progress',
                          }))}
                          error={error}
                        />
                      </div>
                    )}
                    {/* Response content streams BELOW thinking */}
                    {message.content && (
                      <div style={styles.streamingResponseText}>
                        <MessageContent content={message.content} />
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Regular completed messages
            return (
              <MessageBubble
                key={idx}
                message={message}
              />
            );
          })}

          {/* Error banner - only show if ThinkingBlock isn't handling it */}
          {error && !showThinkingBlock && (
            <div style={styles.errorBanner}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div style={styles.inputContainer}>
        <div style={styles.inputInner}>
          {/* File previews - above input */}
          {files.length > 0 && (
            <div style={{ ...styles.filePreview, marginBottom: '8px' }}>
              {files.map((file, idx) => (
                <div key={idx} style={styles.fileChip}>
                  <Paperclip size={12} />
                  <span>{file.name}</span>
                  <button
                    style={styles.fileChipRemove}
                    onClick={() => handleRemoveFile(idx)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{
            ...styles.inputWrapper,
            ...(isFocused ? styles.inputWrapperFocused : {}),
          }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const selectedFiles = Array.from(e.target.files);
                setFiles(prev => [...prev, ...selectedFiles]);
                e.target.value = '';
              }}
              accept=".pdf,.doc,.docx"
              multiple
              style={{ display: 'none' }}
            />
            <button
              style={styles.attachButton}
              onClick={() => fileInputRef.current?.click()}
              title="Attach files"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primaryLight;
                e.currentTarget.style.color = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = colors.textSecondary;
              }}
            >
              <Paperclip size={18} />
            </button>

            <textarea
              ref={textAreaRef}
              style={styles.textArea}
              placeholder="Message Gail..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              rows={1}
            />

            {isStreaming ? (
              <button
                style={styles.stopButton}
                onClick={onStop}
                title="Stop generating"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.errorBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.backgroundInput;
                }}
              >
                <StopCircle size={18} />
              </button>
            ) : (
              <button
                style={{
                  ...styles.sendButton,
                  ...(!canSend ? styles.sendButtonDisabled : {}),
                }}
                onClick={handleSubmit}
                disabled={!canSend}
                title="Send message"
                onMouseEnter={(e) => canSend && (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => canSend && (e.currentTarget.style.opacity = '1')}
              >
                <ArrowUp size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        Gail can make mistakes. Please verify important information.
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Main ChatPanel Component
export default function ChatPanel({
  messages = [],
  isStreaming = false,
  currentThinking = '',
  currentToolCalls = [],
  error = null,
  isThinkingComplete = false,
  onSend,
  onStop,
}) {
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const isWelcomeMode = messages.length === 0 && !isStreaming;

  if (isWelcomeMode) {
    return (
      <WelcomeView
        onSend={onSend}
        input={input}
        setInput={setInput}
        files={files}
        setFiles={setFiles}
        fileInputRef={fileInputRef}
      />
    );
  }

  return (
    <ChatView
      messages={messages}
      isStreaming={isStreaming}
      currentThinking={currentThinking}
      currentToolCalls={currentToolCalls}
      error={error}
      isThinkingComplete={isThinkingComplete}
      onSend={onSend}
      onStop={onStop}
      input={input}
      setInput={setInput}
      files={files}
      setFiles={setFiles}
      fileInputRef={fileInputRef}
    />
  );
}
