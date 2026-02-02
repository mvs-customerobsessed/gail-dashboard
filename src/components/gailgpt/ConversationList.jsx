import { MessageSquare, Trash2, Loader2 } from 'lucide-react';

const styles = {
  container: {
    flex: 1,
    overflowY: 'auto',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    color: '#64748B',
  },
  emptyState: {
    padding: '32px 16px',
    textAlign: 'center',
    color: '#64748B',
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
  },
  emptyTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1E293B',
    marginBottom: '4px',
  },
  emptyText: {
    fontSize: '12px',
    color: '#64748B',
  },
  list: {
    padding: '8px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginBottom: '4px',
  },
  itemActive: {
    backgroundColor: '#EFF6FF',
  },
  itemIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748B',
    flexShrink: 0,
  },
  itemIconActive: {
    backgroundColor: '#0062e2',
    color: '#FFFFFF',
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#1E293B',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  itemDate: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '2px',
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
    color: '#94A3B8',
    opacity: 0,
    transition: 'all 0.2s',
  },
  deleteButtonVisible: {
    opacity: 1,
  },
};

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export default function ConversationList({
  conversations = [],
  activeConversation = null,
  onSelect,
  onDelete,
  loading = false,
}) {
  if (loading) {
    return (
      <div style={styles.loading}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>
          <MessageSquare size={20} />
        </div>
        <div style={styles.emptyTitle}>No conversations</div>
        <div style={styles.emptyText}>
          Start a new chat to begin
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.list}>
        {conversations.map((conversation) => {
          const isActive = activeConversation?.id === conversation.id;

          return (
            <div
              key={conversation.id}
              style={{
                ...styles.item,
                ...(isActive ? styles.itemActive : {}),
              }}
              onClick={() => onSelect(conversation)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                }
                const deleteBtn = e.currentTarget.querySelector('[data-delete]');
                if (deleteBtn) deleteBtn.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
                const deleteBtn = e.currentTarget.querySelector('[data-delete]');
                if (deleteBtn) deleteBtn.style.opacity = '0';
              }}
            >
              <div style={{
                ...styles.itemIcon,
                ...(isActive ? styles.itemIconActive : {}),
              }}>
                <MessageSquare size={14} />
              </div>

              <div style={styles.itemContent}>
                <div style={styles.itemTitle}>
                  {conversation.title || 'New Conversation'}
                </div>
                <div style={styles.itemDate}>
                  {formatDate(conversation.updated_at || conversation.created_at)}
                </div>
              </div>

              <button
                data-delete
                style={styles.deleteButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conversation.id);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FEF2F2';
                  e.currentTarget.style.color = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#94A3B8';
                }}
                title="Delete conversation"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
