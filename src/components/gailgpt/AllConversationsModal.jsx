import { useState, useMemo } from 'react';
import { X, Search, MessageSquare, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import { colors, transitions, borderRadius, typography, shadows } from './designTokens';

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  modal: {
    backgroundColor: colors.backgroundInput,
    borderRadius: '12px',
    width: '100%',
    maxWidth: '560px',
    maxHeight: '70vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.border}`,
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: colors.textPrimary,
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
  searchContainer: {
    padding: '12px 20px',
    borderBottom: `1px solid ${colors.border}`,
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 40px',
    fontSize: '14px',
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: colors.background,
    color: colors.textPrimary,
    transition: transitions.fast,
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: colors.textSecondary,
  },
  searchWrapper: {
    position: 'relative',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 12px',
  },
  dateGroup: {
    marginBottom: '16px',
  },
  dateGroupTitle: {
    fontSize: '12px',
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '8px 8px 4px',
  },
  conversationCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: transitions.fast,
  },
  conversationIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: colors.backgroundSidebar,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.textSecondary,
    flexShrink: 0,
  },
  conversationContent: {
    flex: 1,
    minWidth: 0,
  },
  conversationHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  conversationTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: colors.textPrimary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  conversationTimestamp: {
    fontSize: '12px',
    color: colors.textSecondary,
    flexShrink: 0,
    marginLeft: '8px',
  },
  conversationPreview: {
    fontSize: '13px',
    color: colors.textSecondary,
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  actionsButton: {
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
  actionsMenu: {
    position: 'absolute',
    right: 0,
    top: '100%',
    marginTop: '4px',
    backgroundColor: colors.backgroundInput,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    boxShadow: shadows.card,
    overflow: 'hidden',
    zIndex: 10,
  },
  actionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    color: colors.textPrimary,
    cursor: 'pointer',
    border: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left',
    transition: transitions.fast,
  },
  actionItemDanger: {
    color: colors.error,
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
    backgroundColor: colors.backgroundSidebar,
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
};

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getDateGroup(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'Previous 7 Days';
  if (diffDays < 30) return 'This Month';
  return 'Older';
}

function ConversationCard({ conversation, onSelect, onDelete, onRename }) {
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (window.confirm('Delete this conversation?')) {
      onDelete(conversation.id);
    }
  };

  return (
    <div
      style={styles.conversationCard}
      onClick={() => onSelect(conversation)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = colors.primary;
        e.currentTarget.querySelector('[data-actions]').style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = colors.border;
        e.currentTarget.querySelector('[data-actions]').style.opacity = '0';
        setShowMenu(false);
      }}
    >
      <div style={styles.conversationIcon}>
        <MessageSquare size={16} />
      </div>
      <div style={styles.conversationContent}>
        <div style={styles.conversationHeader}>
          <span style={styles.conversationTitle}>
            {conversation.title || 'New Conversation'}
          </span>
          <span style={styles.conversationTimestamp}>
            {formatDate(conversation.updated_at || conversation.created_at)}
          </span>
        </div>
        <div style={styles.conversationPreview}>
          {conversation.preview || 'No messages yet'}
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <button
          data-actions
          style={styles.actionsButton}
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryLight}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <MoreHorizontal size={16} />
        </button>
        {showMenu && (
          <div style={styles.actionsMenu}>
            <button
              style={styles.actionItem}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                // Rename functionality would go here
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryLight}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Pencil size={14} />
              Rename
            </button>
            <button
              style={{ ...styles.actionItem, ...styles.actionItemDanger }}
              onClick={handleDelete}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.errorBg}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AllConversationsModal({
  isOpen,
  onClose,
  conversations = [],
  onSelect,
  onDelete,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and group conversations
  const { filteredConversations, groupedConversations } = useMemo(() => {
    const filtered = conversations.filter(conv =>
      !searchQuery ||
      (conv.title && conv.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Group by date
    const groups = {};
    filtered.forEach(conv => {
      const group = getDateGroup(conv.updated_at || conv.created_at);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(conv);
    });

    // Order groups
    const orderedGroups = ['Today', 'Yesterday', 'Previous 7 Days', 'This Month', 'Older'];
    const sortedGroups = {};
    orderedGroups.forEach(group => {
      if (groups[group]) {
        sortedGroups[group] = groups[group];
      }
    });

    return {
      filteredConversations: filtered,
      groupedConversations: sortedGroups,
    };
  }, [conversations, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (conversation) => {
    onSelect(conversation);
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.headerTitle}>All Conversations</span>
          <button
            style={styles.closeButton}
            onClick={onClose}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryLight}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              style={styles.searchInput}
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.boxShadow = shadows.focus;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {filteredConversations.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <MessageSquare size={20} />
              </div>
              <div style={styles.emptyTitle}>
                {searchQuery ? 'No matching conversations' : 'No conversations yet'}
              </div>
              <div style={styles.emptyText}>
                {searchQuery ? 'Try a different search term' : 'Start a new chat to begin'}
              </div>
            </div>
          ) : (
            Object.entries(groupedConversations).map(([group, convs]) => (
              <div key={group} style={styles.dateGroup}>
                <div style={styles.dateGroupTitle}>{group}</div>
                {convs.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    onSelect={handleSelect}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
