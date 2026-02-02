import { History, Plus, X, MessageSquare, Trash2 } from 'lucide-react';
import { colors, transitions, borderRadius } from './designTokens';

const styles = {
  drawer: {
    position: 'fixed',
    top: '64px',
    left: 0,
    bottom: 0,
    width: '320px',
    backgroundColor: colors.backgroundSidebar,
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.08)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    transform: 'translateX(-100%)',
    transition: 'transform 0.3s ease',
  },
  drawerOpen: {
    transform: 'translateX(0)',
  },
  header: {
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: colors.textPrimary,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    color: colors.textSecondary,
    transition: transitions.fast,
  },
  newChatButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    margin: '16px 20px',
    padding: '12px 16px',
    backgroundColor: colors.primary,
    color: colors.textOnPrimary,
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: transitions.fast,
  },
  conversationList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 12px',
  },
  conversationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    marginBottom: '4px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: transitions.fast,
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
  },
  conversationItemActive: {
    backgroundColor: colors.primaryLight,
    borderLeft: `3px solid ${colors.primary}`,
  },
  conversationIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: colors.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textSecondary,
    flexShrink: 0,
  },
  conversationIconActive: {
    backgroundColor: colors.backgroundInput,
    color: colors.primary,
  },
  conversationContent: {
    flex: 1,
    minWidth: 0,
  },
  conversationTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: colors.textPrimary,
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  conversationDate: {
    fontSize: '12px',
    color: colors.textSecondary,
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    cursor: 'pointer',
    color: colors.textSecondary,
    opacity: 0,
    transition: transitions.fast,
    flexShrink: 0,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: colors.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textSecondary,
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: colors.textSecondary,
    marginBottom: '4px',
  },
  emptyText: {
    fontSize: '13px',
    color: colors.textSecondary,
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    color: colors.textSecondary,
    fontSize: '14px',
  },
};

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  conversations = [],
  activeConversation,
  onSelect,
  onDelete,
  onNewChat,
  loading = false,
}) {
  const handleDelete = (e, conversationId) => {
    e.stopPropagation();
    if (window.confirm('Delete this conversation?')) {
      onDelete(conversationId);
    }
  };

  return (
    <div style={{
      ...styles.drawer,
      ...(isOpen ? styles.drawerOpen : {}),
    }}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>
          <History size={18} />
          Conversations
        </span>
        <button
          style={styles.closeButton}
          onClick={onClose}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryLight}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X size={18} />
        </button>
      </div>

      {/* New Chat Button */}
      <button
        style={styles.newChatButton}
        onClick={onNewChat}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
        <Plus size={18} />
        New Conversation
      </button>

      {/* Conversation List */}
      <div style={styles.conversationList}>
        {loading ? (
          <div style={styles.loadingState}>Loading...</div>
        ) : conversations.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <MessageSquare size={20} />
            </div>
            <div style={styles.emptyTitle}>No conversations yet</div>
            <div style={styles.emptyText}>Start a new chat to begin</div>
          </div>
        ) : (
          conversations.map((conversation) => {
            const isActive = activeConversation?.id === conversation.id;
            return (
              <div
                key={conversation.id}
                style={{
                  ...styles.conversationItem,
                  ...(isActive ? styles.conversationItemActive : {}),
                }}
                onClick={() => onSelect(conversation)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.primaryLight;
                  }
                  e.currentTarget.querySelector('[data-delete]').style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                  e.currentTarget.querySelector('[data-delete]').style.opacity = '0';
                }}
              >
                <div style={{
                  ...styles.conversationIcon,
                  ...(isActive ? styles.conversationIconActive : {}),
                }}>
                  <MessageSquare size={16} />
                </div>
                <div style={styles.conversationContent}>
                  <div style={styles.conversationTitle}>
                    {conversation.title || 'New Conversation'}
                  </div>
                  <div style={styles.conversationDate}>
                    {formatDate(conversation.updated_at || conversation.created_at)}
                  </div>
                </div>
                <button
                  data-delete
                  style={styles.deleteButton}
                  onClick={(e) => handleDelete(e, conversation.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.errorBg;
                    e.currentTarget.style.color = colors.error;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = colors.textSecondary;
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
