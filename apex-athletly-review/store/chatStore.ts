/**
 * Chat Store — Athletly V2
 *
 * Zustand store for coach chat state:
 * - Messages (newest-first for inverted FlatList)
 * - Session management
 * - Checkpoint confirm/reject via POST /chat/confirm
 * - Message loading from Supabase session_messages
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';
import type { ChatMessage, Checkpoint } from '@/types/chat';

const TAG = 'ChatStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://athletly.rnltlabs.de';

interface ChatState {
  messages: ChatMessage[];
  sessionId: string | null;
  isTyping: boolean;
  pendingCheckpoint: Checkpoint | null;
  isConfirming: boolean;
  error: string | null;

  addMessage: (msg: ChatMessage) => void;
  setSessionId: (id: string) => void;
  setTyping: (value: boolean) => void;
  setPendingCheckpoint: (cp: Checkpoint | null) => void;
  confirmCheckpoint: (accepted: boolean) => Promise<void>;
  loadMessages: (userId: string) => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
}

/**
 * Call POST /chat/confirm on the Python backend
 */
async function callConfirmAPI(
  sessionId: string,
  actionId: string,
  confirmed: boolean,
): Promise<{ status: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/chat/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      session_id: sessionId,
      action_id: actionId,
      confirmed,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[chatStore] Confirm API error:', errorText);
    throw new Error(`Confirm API error: ${response.status}`);
  }

  return response.json();
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sessionId: null,
  isTyping: false,
  pendingCheckpoint: null,
  isConfirming: false,
  error: null,

  addMessage: (msg) => {
    log.debug(TAG, `addMessage: ${msg.role}`, { id: msg.id, length: msg.content.length });
    set((state) => ({ messages: [msg, ...state.messages] }));
  },

  setSessionId: (id) => {
    log.info(TAG, `setSessionId: ${id}`);
    set({ sessionId: id });
  },

  setTyping: (value) => set({ isTyping: value }),

  setPendingCheckpoint: (cp) => set({ pendingCheckpoint: cp }),

  confirmCheckpoint: async (accepted) => {
    const { pendingCheckpoint, sessionId } = get();
    if (!pendingCheckpoint || !sessionId) {
      return;
    }

    log.info(TAG, 'Confirming checkpoint', { id: pendingCheckpoint.id, accepted });
    set({ isConfirming: true, error: null });

    try {
      const endTimer = log.time(TAG, 'confirmCheckpoint');
      await callConfirmAPI(sessionId, pendingCheckpoint.id, accepted);
      endTimer();

      const confirmMessage: ChatMessage = {
        id: `confirm-${Date.now()}`,
        role: 'assistant',
        content: accepted ? 'Aktion bestatigt.' : 'Aktion abgelehnt.',
        timestamp: new Date(),
        synced: false,
      };

      set((state) => ({
        messages: [confirmMessage, ...state.messages],
        pendingCheckpoint: null,
        isConfirming: false,
      }));
    } catch (err) {
      console.error('[chatStore] Error confirming checkpoint:', err);
      set({
        isConfirming: false,
        error: err instanceof Error ? err.message : 'Fehler beim Bestatigen',
      });
    }
  },

  loadMessages: async (userId) => {
    set({ error: null });
    log.info(TAG, 'Loading messages', { userId: userId.slice(0, 8) });
    const endTimer = log.time(TAG, 'loadMessages');

    try {
      const { data, error } = await supabase
        .from('session_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      endTimer();
      if (data && data.length > 0) {
        log.info(TAG, `Loaded ${data.length} messages`, { sessionId: data[0].session_id });
        const messages: ChatMessage[] = data.map((msg) => ({
          id: msg.id,
          role: (msg.role === 'model' ? 'assistant' : msg.role) as ChatMessage['role'],
          content: msg.content,
          timestamp: new Date(msg.created_at || Date.now()),
          synced: true,
        }));

        set({
          messages,
          sessionId: data[0].session_id || null,
        });
      } else {
        log.info(TAG, 'No messages found, showing welcome');
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: 'Du kannst jetzt loslegen - erzahl mir worauf du dich vorbereiten willst.',
          timestamp: new Date(),
          synced: false,
        };

        set({ messages: [welcomeMessage] });
      }
    } catch (err) {
      console.error('[chatStore] Error loading messages:', err);
      set({
        error: err instanceof Error ? err.message : 'Fehler beim Laden der Nachrichten',
      });
    }
  },

  clearMessages: () => set({ messages: [], sessionId: null }),

  clearError: () => set({ error: null }),
}));
