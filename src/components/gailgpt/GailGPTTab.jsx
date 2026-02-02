import { useState, useCallback, useEffect, useRef } from 'react';
import ChatPanel from './ChatPanel';
import ArtifactPanel from './ArtifactPanel';
import HistoryDrawer from './HistoryDrawer';
import { useConversations } from '../../hooks/useConversations';
import { useGailGPT } from '../../hooks/useGailGPT';
import { useAuth } from '../../hooks/useAuth';
import { colors, transitions } from './designTokens';

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: colors.background,
    overflow: 'hidden',
    position: 'relative',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    transition: transitions.normal,
  },
  chatSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.background,
    minWidth: 0,
    transition: transitions.normal,
  },
  artifactSection: {
    width: '55%',
    maxWidth: '800px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.background,
    borderLeft: `1px solid ${colors.border}`,
    transform: 'translateX(0)',
    transition: 'transform 0.3s ease, opacity 0.3s ease',
  },
  artifactSectionHidden: {
    width: 0,
    opacity: 0,
    transform: 'translateX(100%)',
    overflow: 'hidden',
    borderLeft: 'none',
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 40,
    opacity: 0,
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none',
  },
  backdropVisible: {
    opacity: 1,
    pointerEvents: 'auto',
  },
};

export default function GailGPTTab() {
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showArtifactPanel, setShowArtifactPanel] = useState(false);
  // Track when we're creating a new conversation and sending a message to prevent race conditions
  const skipNextLoadRef = useRef(false);

  const { user } = useAuth();

  // Get user's first name from metadata or email
  const userName = user?.user_metadata?.full_name?.split(' ')[0] ||
                   user?.email?.split('@')[0] ||
                   '';

  const {
    conversations,
    activeConversation,
    loading: conversationsLoading,
    createConversation,
    setActiveConversation,
    loadMessages,
    saveMessage,
    deleteConversation,
  } = useConversations();

  const {
    messages,
    isStreaming,
    currentThinking,
    currentToolCalls,
    currentArtifact,
    artifacts,
    error,
    send,
    stop,
    clear,
    setMessages,
  } = useGailGPT(activeConversation?.id);

  // Show artifact panel when artifacts exist
  useEffect(() => {
    const hasArtifacts = artifacts.length > 0 || currentArtifact !== null;
    if (hasArtifacts && !showArtifactPanel) {
      setShowArtifactPanel(true);
    }
  }, [artifacts, currentArtifact, showArtifactPanel]);

  // Load messages when active conversation changes
  useEffect(() => {
    // Skip loading if we just created a conversation and are about to send a message
    // This prevents race conditions where loadMessages returns before/after send() adds messages
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      return;
    }

    if (activeConversation?.id) {
      loadMessages(activeConversation.id).then((msgs) => {
        if (msgs && msgs.length > 0) {
          setMessages(msgs.map(m => ({
            role: m.role,
            content: m.content,
            thinking: m.thinking,
            toolCalls: m.tool_calls || [],
            artifacts: m.artifacts || [],
          })));
        } else {
          setMessages([]);
        }
      });
    } else {
      setMessages([]);
    }
  }, [activeConversation?.id, loadMessages, setMessages]);

  const handleNewChat = useCallback(async () => {
    const conversation = await createConversation();
    if (conversation) {
      clear();
      setShowArtifactPanel(false);
    }
    setShowHistoryDrawer(false);
  }, [createConversation, clear]);

  const handleSelectConversation = useCallback((conversation) => {
    setActiveConversation(conversation);
    setShowHistoryDrawer(false);
    // Check if this conversation has artifacts and show panel if so
    if (conversation?.artifacts?.length > 0) {
      setShowArtifactPanel(true);
    }
  }, [setActiveConversation]);

  const handleSendMessage = useCallback(async (content, files = []) => {
    console.log('handleSendMessage called:', { content, hasActiveConversation: !!activeConversation });
    if (!activeConversation) {
      // Create a new conversation first
      console.log('Creating new conversation...');
      // Skip the next loadMessages call to prevent race condition
      skipNextLoadRef.current = true;
      const conversation = await createConversation(content.slice(0, 50) + (content.length > 50 ? '...' : ''));
      console.log('Conversation created:', conversation);
      if (conversation) {
        // Save user message
        console.log('Saving user message...');
        await saveMessage(conversation.id, { role: 'user', content });
        // Send to AI - pass conversation.id since state hasn't updated yet
        console.log('Calling send with conversation.id:', conversation.id);
        await send(content, files, conversation.id);
      } else {
        console.error('Failed to create conversation');
        skipNextLoadRef.current = false; // Reset if creation failed
      }
    } else {
      // Save user message
      console.log('Saving message to existing conversation:', activeConversation.id);
      await saveMessage(activeConversation.id, { role: 'user', content });
      // Send to AI
      console.log('Calling send...');
      await send(content, files);
    }
  }, [activeConversation, createConversation, saveMessage, send]);

  const handleDeleteConversation = useCallback(async (conversationId) => {
    await deleteConversation(conversationId);
    if (activeConversation?.id === conversationId) {
      clear();
      setShowArtifactPanel(false);
    }
  }, [deleteConversation, activeConversation, clear]);

  const handleCloseArtifactPanel = useCallback(() => {
    setShowArtifactPanel(false);
  }, []);

  const handleToggleHistory = useCallback(() => {
    setShowHistoryDrawer(prev => !prev);
  }, []);

  const handleCloseHistory = useCallback(() => {
    setShowHistoryDrawer(false);
  }, []);

  // Determine if we should show the artifact panel
  const hasArtifacts = artifacts.length > 0 || currentArtifact !== null;
  const artifactPanelVisible = showArtifactPanel && hasArtifacts;

  return (
    <div style={styles.container}>
      {/* History Drawer Backdrop */}
      <div
        style={{
          ...styles.backdrop,
          ...(showHistoryDrawer ? styles.backdropVisible : {}),
        }}
        onClick={handleCloseHistory}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={showHistoryDrawer}
        onClose={handleCloseHistory}
        conversations={conversations}
        activeConversation={activeConversation}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        onNewChat={handleNewChat}
        loading={conversationsLoading}
      />

      {/* Main Content Area */}
      <div style={styles.mainContent}>
        {/* Chat Panel - takes full width when no artifacts */}
        <div style={styles.chatSection}>
          <ChatPanel
            messages={messages}
            isStreaming={isStreaming}
            currentThinking={currentThinking}
            currentToolCalls={currentToolCalls}
            error={error}
            onSend={handleSendMessage}
            onStop={stop}
            onToggleHistory={handleToggleHistory}
            userName={userName}
          />
        </div>

        {/* Artifact Panel - slides in from right */}
        <div style={{
          ...styles.artifactSection,
          ...(!artifactPanelVisible ? styles.artifactSectionHidden : {}),
        }}>
          {artifactPanelVisible && (
            <ArtifactPanel
              artifacts={artifacts}
              currentArtifact={currentArtifact}
              onClose={handleCloseArtifactPanel}
            />
          )}
        </div>
      </div>
    </div>
  );
}
