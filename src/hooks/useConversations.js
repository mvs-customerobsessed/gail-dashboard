import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../components/auth/AuthProvider';

export function useConversations() {
  const { user } = useAuthContext();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load conversations on mount and when user changes
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setActiveConversation(null);
      setLoading(false);
      return;
    }
    loadConversations();
  }, [user]);

  const loadConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('gailgpt_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setConversations(data || []);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createConversation = useCallback(async (title = 'New Conversation') => {
    console.log('createConversation called', { user: user?.id, title });
    if (!user) {
      console.error('createConversation: No user');
      return null;
    }

    try {
      console.log('Inserting conversation into Supabase...');
      const { data, error: insertError } = await supabase
        .from('gailgpt_conversations')
        .insert({
          user_id: user.id,
          title: title,
          metadata: {},
        })
        .select()
        .single();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw insertError;
      }

      console.log('Conversation created successfully:', data);
      setConversations(prev => [data, ...prev]);
      setActiveConversation(data);
      return data;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(err.message);
      return null;
    }
  }, [user]);

  const updateConversationTitle = useCallback(async (conversationId, title) => {
    try {
      const { error: updateError } = await supabase
        .from('gailgpt_conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (updateError) throw updateError;

      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, title } : c)
      );

      if (activeConversation?.id === conversationId) {
        setActiveConversation(prev => ({ ...prev, title }));
      }
    } catch (err) {
      console.error('Error updating conversation title:', err);
      setError(err.message);
    }
  }, [activeConversation]);

  const loadMessages = useCallback(async (conversationId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('gailgpt_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message);
      return [];
    }
  }, []);

  const saveMessage = useCallback(async (conversationId, message) => {
    try {
      const { data, error: insertError } = await supabase
        .from('gailgpt_messages')
        .insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content || '',
          thinking: message.thinking || null,
          tool_calls: message.toolCalls || [],
          artifacts: message.artifacts || [],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update conversation timestamp
      await supabase
        .from('gailgpt_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Update local state
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId
            ? { ...c, updated_at: new Date().toISOString() }
            : c
        )
      );

      return data;
    } catch (err) {
      console.error('Error saving message:', err);
      setError(err.message);
      return null;
    }
  }, []);

  const updateMessage = useCallback(async (messageId, updates) => {
    try {
      const { error: updateError } = await supabase
        .from('gailgpt_messages')
        .update(updates)
        .eq('id', messageId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error updating message:', err);
      setError(err.message);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId) => {
    try {
      const { error: deleteError } = await supabase
        .from('gailgpt_conversations')
        .delete()
        .eq('id', conversationId);

      if (deleteError) throw deleteError;

      setConversations(prev => prev.filter(c => c.id !== conversationId));

      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError(err.message);
    }
  }, [activeConversation]);

  const saveArtifact = useCallback(async (conversationId, messageId, artifact) => {
    try {
      const { data, error: insertError } = await supabase
        .from('gailgpt_artifacts')
        .insert({
          conversation_id: conversationId,
          message_id: messageId,
          artifact_type: artifact.type || artifact.artifact_type,
          title: artifact.title,
          content: artifact.content,
          storage_path: artifact.storage_path || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return data;
    } catch (err) {
      console.error('Error saving artifact:', err);
      setError(err.message);
      return null;
    }
  }, []);

  const loadArtifacts = useCallback(async (conversationId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('gailgpt_artifacts')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      return data || [];
    } catch (err) {
      console.error('Error loading artifacts:', err);
      setError(err.message);
      return [];
    }
  }, []);

  return {
    conversations,
    activeConversation,
    loading,
    error,
    createConversation,
    setActiveConversation,
    updateConversationTitle,
    loadMessages,
    saveMessage,
    updateMessage,
    deleteConversation,
    saveArtifact,
    loadArtifacts,
    refresh: loadConversations,
  };
}
