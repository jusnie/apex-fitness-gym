/**
 * Coach Chat Screen - Athletly V2 (chat-first)
 *
 * Primary interaction surface. The agent drives both onboarding and
 * regular coaching here. Action requests from the backend surface as
 * inline cards in the chat history.
 *
 * - Inverted FlatList (newest at bottom)
 * - Agent status indicator (thinking/tool calls)
 * - Checkpoint cards inline for plan approval
 * - Action cards inline for agent-proposed actions (e.g. garmin_connect)
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  AppState,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { GradientHeader } from '@/components/ui/GradientHeader';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useChatStream } from '@/hooks/useChatStream';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { AgentStatus } from '@/components/chat/AgentStatus';
import { CheckpointCard } from '@/components/chat/CheckpointCard';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { ActionCard } from '@/components/chat/ActionCard';
import { ToolGroup } from '@/components/chat/ToolGroup';
import { ShowWorkFooter } from '@/components/chat/ShowWorkFooter';
import { renderUIComponent } from '@/components/chat/genui';
import { log } from '@/lib/logger';
import type {
  ChatMessage,
  StreamProgress,
  ActionRequest,
  ChatContext,
  ChatItem,
  UIComponent,
  ToolEvent,
  ToolStep,
} from '@/types/chat';

const TAG = 'CoachScreen';

const WELCOME_REPLIES = [
  'Erstelle einen Trainingsplan',
  'Analysiere mein Training',
  'Wie geht es meiner Erholung?',
];

const FRESH_SESSION_PLACEHOLDER =
  'Du kannst jetzt loslegen - erzahl mir worauf du dich vorbereiten willst.';

function makeActionItem(action: ActionRequest): Extract<ChatItem, { kind: 'action' }> {
  return {
    kind: 'action',
    id: `action-${action.type}-${Date.now()}`,
    actionType: action.type,
    label: action.label,
    payload: action.payload,
    timestamp: new Date(),
  };
}

function makeUIItem(component: UIComponent): Extract<ChatItem, { kind: 'ui' }> {
  return {
    kind: 'ui',
    id: component.id,
    component,
    resolved: false,
    timestamp: new Date(),
  };
}

type ToolGroupItem = Extract<ChatItem, { kind: 'tool_group' }>;

function makeToolGroupItem(groupId: string): ToolGroupItem {
  return {
    kind: 'tool_group',
    id: groupId,
    steps: [],
    endedAt: null,
    timestamp: new Date(),
  };
}

/**
 * Within a group, the previous 'running' step transitions to 'done'
 * implicitly when the next tool_hint arrives. The newest step is added
 * with 'running' status. Pure immutable update.
 */
function appendStepToGroup(
  group: ToolGroupItem,
  step: { toolName: string; displayLabel: string },
): ToolGroupItem {
  const updatedSteps: ToolStep[] = group.steps.map((s) =>
    s.status === 'running' ? { ...s, status: 'done' as const } : s,
  );
  updatedSteps.push({
    toolName: step.toolName,
    displayLabel: step.displayLabel,
    status: 'running',
  });
  return { ...group, steps: updatedSteps };
}

function finalizeGroup(group: ToolGroupItem): ToolGroupItem {
  const finalSteps: ToolStep[] = group.steps.map((s) =>
    s.status === 'running' || s.status === 'pending'
      ? { ...s, status: 'done' as const }
      : s,
  );
  return { ...group, steps: finalSteps, endedAt: new Date() };
}

export default function CoachScreen() {
  const user = useAuthStore((s) => s.user);
  const isOnboarded = useAuthStore((s) => s.isOnboarded);
  const {
    messages,
    sessionId,
    isTyping,
    pendingCheckpoint,
    isConfirming,
    addMessage,
    setSessionId,
    setTyping,
    setPendingCheckpoint,
    confirmCheckpoint,
    loadMessages,
  } = useChatStore();

  const { sendMessage, isStreaming, toolsUsed } = useChatStream();
  const voice = useVoiceInput();

  const { prefill, draft } = useLocalSearchParams<{
    prefill?: string;
    draft?: string;
  }>();
  const [agentStatus, setAgentStatus] = useState('');
  const [agentTool, setAgentTool] = useState<string | undefined>(undefined);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<
    ReadonlyArray<Extract<ChatItem, { kind: 'action' }>>
  >([]);
  const [uiItems, setUiItems] = useState<
    ReadonlyArray<Extract<ChatItem, { kind: 'ui' }>>
  >([]);
  const [activeToolGroups, setActiveToolGroups] = useState<
    ReadonlyArray<ToolGroupItem>
  >([]);
  /**
   * Groups that have ended in this session but whose steps need to attach
   * to the next assistant message that arrives. Once attached, they are
   * removed from this buffer.
   */
  const pendingFinishedGroupsRef = useRef<ToolGroupItem[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const prefillHandled = useRef(false);
  const autoOnboardingFired = useRef(false);
  /**
   * `draft` is the non-auto-sending counterpart to `prefill`. It seeds
   * the chat input with editable text (used by the "Im Chat anpassen"
   * buttons on the identity screen) but never triggers a send. We expose
   * it to the ChatInput only on the first render after it changes so
   * a stale URL param can't overwrite what the user is typing.
   */
  const draftHandled = useRef(false);
  const [activeDraft, setActiveDraft] = useState<string | undefined>(undefined);

  useEffect(() => {
    log.info(TAG, 'Screen mounted', { userId: user?.id?.slice(0, 8) });
    return () => log.info(TAG, 'Screen unmounted');
  }, [user?.id]);

  // Load messages on mount
  useEffect(() => {
    if (user?.id) {
      log.info(TAG, 'Loading messages');
      loadMessages(user.id);
    }
  }, [user?.id, loadMessages]);

  // Reload messages when app returns from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && user?.id && !isStreaming) {
        log.info(TAG, 'App became active - reloading messages');
        loadMessages(user.id);
      }
    });
    return () => subscription.remove();
  }, [user?.id, isStreaming, loadMessages]);

  useEffect(() => {
    if (messages.length === 1 && messages[0]?.id === 'welcome' && isOnboarded) {
      setQuickReplies(WELCOME_REPLIES);
    }
  }, [messages, isOnboarded]);

  const handleActionRequest = useCallback((action: ActionRequest) => {
    log.info(TAG, 'Action request received', { type: action.type });
    setActionItems((prev) => [makeActionItem(action), ...prev]);
  }, []);

  const handleUIComponent = useCallback((component: UIComponent) => {
    log.info(TAG, 'UI component received', { type: component.type, id: component.id });
    setUiItems((prev) => [makeUIItem(component), ...prev]);
  }, []);

  const handleToolGroupStart = useCallback((groupId: string) => {
    log.info(TAG, 'Tool group start', { groupId });
    setActiveToolGroups((prev) => {
      if (prev.some((g) => g.id === groupId)) {
        return prev;
      }
      return [makeToolGroupItem(groupId), ...prev];
    });
  }, []);

  const handleToolEvent = useCallback((event: ToolEvent) => {
    log.info(TAG, 'Tool event', {
      name: event.name,
      groupId: event.groupId,
    });
    setActiveToolGroups((prev) => {
      const existing = prev.find((g) => g.id === event.groupId);
      if (!existing) {
        // tool_hint arrived before tool_group_start (or backend without
        // explicit group_start). Create the group lazily.
        const seed = makeToolGroupItem(event.groupId);
        const seeded = appendStepToGroup(seed, {
          toolName: event.name,
          displayLabel: event.displayLabel,
        });
        return [seeded, ...prev];
      }
      return prev.map((g) =>
        g.id === event.groupId
          ? appendStepToGroup(g, {
              toolName: event.name,
              displayLabel: event.displayLabel,
            })
          : g,
      );
    });
  }, []);

  const handleToolGroupEnd = useCallback((groupId: string) => {
    log.info(TAG, 'Tool group end', { groupId });
    setActiveToolGroups((prev) => {
      const target = prev.find((g) => g.id === groupId);
      if (!target) {
        return prev;
      }
      const finalized = finalizeGroup(target);
      // Buffer the finalized group for attachment to the next assistant
      // message via ShowWorkFooter.
      pendingFinishedGroupsRef.current = [
        ...pendingFinishedGroupsRef.current,
        finalized,
      ];
      return prev.filter((g) => g.id !== groupId);
    });
  }, []);

  /**
   * Drain pending finished tool groups onto the given assistant message
   * so its ShowWorkFooter can render. Returns the message (immutably
   * updated when there are pending steps).
   */
  const attachPendingToolStepsToMessage = useCallback(
    (msg: ChatMessage): ChatMessage => {
      const pending = pendingFinishedGroupsRef.current;
      if (pending.length === 0) {
        return msg;
      }
      const allSteps: ToolStep[] = pending.flatMap((g) => g.steps);
      pendingFinishedGroupsRef.current = [];
      return { ...msg, toolSteps: allSteps };
    },
    [],
  );

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date(),
        synced: false,
      };
      log.info(TAG, 'User sending message', { length: text.length, sessionId: sessionId || 'new' });
      addMessage(userMsg);
      setTyping(true);
      setQuickReplies([]);
      setAgentStatus('Denke nach...');
      setAgentTool(undefined);

      // First message of a fresh / not-yet-onboarded user runs the
      // onboarding skill on the backend.
      const context: ChatContext = !isOnboarded ? 'onboarding' : 'coach';

      try {
        await sendMessage(
          text,
          sessionId || 'new',
          (msg) => {
            const baseMsg: ChatMessage = {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: msg.content,
              timestamp: new Date(),
              toolCalls: toolsUsed.length > 0 ? [...toolsUsed] : undefined,
              synced: false,
            };
            // Attach any finished tool groups so the ShowWorkFooter
            // renders under this assistant bubble.
            const assistantMsg = attachPendingToolStepsToMessage(baseMsg);
            addMessage(assistantMsg);
            setSessionId(msg.sessionId);
          },
          (prog: StreamProgress) => {
            setAgentStatus(prog.status);
            setAgentTool(prog.tool);
          },
          context,
          undefined,
          (cp) => {
            setPendingCheckpoint(cp);
          },
          handleActionRequest,
          handleUIComponent,
          handleToolEvent,
          handleToolGroupStart,
          handleToolGroupEnd,
        );
      } catch (err) {
        log.error(TAG, 'Send error', { error: String(err) });
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'system',
          content: 'Fehler beim Senden. Bitte versuche es erneut.',
          timestamp: new Date(),
          synced: false,
        };
        addMessage(errorMsg);
      } finally {
        setTyping(false);
        setAgentStatus('');
        setAgentTool(undefined);
        // Drain any tool groups still marked active (e.g. backend ended
        // without an explicit tool_group_end) so the UI doesn't leave
        // an orphaned spinning card behind.
        setActiveToolGroups((prev) => {
          if (prev.length === 0) {
            return prev;
          }
          pendingFinishedGroupsRef.current = [
            ...pendingFinishedGroupsRef.current,
            ...prev.map(finalizeGroup),
          ];
          return [];
        });
      }
    },
    [
      sessionId,
      sendMessage,
      addMessage,
      setSessionId,
      setTyping,
      setPendingCheckpoint,
      toolsUsed,
      isOnboarded,
      handleActionRequest,
      handleUIComponent,
      handleToolEvent,
      handleToolGroupStart,
      handleToolGroupEnd,
      attachPendingToolStepsToMessage,
    ],
  );

  useEffect(() => {
    if (prefill && !prefillHandled.current) {
      prefillHandled.current = true;
      handleSend(prefill);
    }
  }, [prefill, handleSend]);

  // Forward a fresh `draft` value into the input exactly once per
  // navigation so the user lands in chat with editable text but no
  // auto-send.
  useEffect(() => {
    if (typeof draft === 'string' && draft.length > 0 && !draftHandled.current) {
      draftHandled.current = true;
      setActiveDraft(draft);
      log.info(TAG, 'Draft received', { length: draft.length });
    }
  }, [draft]);

  // First-time onboarding auto-trigger: when a fresh user with no real chat
  // history lands here, kick off the agent's onboarding greeting automatically
  // so the user never sees the static placeholder bubble.
  useEffect(() => {
    if (autoOnboardingFired.current) return;
    if (!user?.id) return;
    if (isOnboarded) return;
    if (sessionId !== null) return;
    if (messages.length !== 1) return;
    if (messages[0]?.id !== 'welcome') return;

    autoOnboardingFired.current = true;
    log.info(TAG, 'Auto-firing onboarding greeting for fresh user');
    useChatStore.getState().clearMessages();
    handleSend('Hallo');
  }, [user?.id, isOnboarded, sessionId, messages, handleSend]);

  const handleQuickReply = useCallback(
    (reply: string) => {
      setQuickReplies([]);
      handleSend(reply);
    },
    [handleSend],
  );

  /**
   * Latest unresolved UI component id - only this one accepts input. Older
   * unresolved components (rare, shouldn't really happen) are also frozen
   * so the user can't double-respond to stale prompts.
   */
  const activeUIComponentId = useMemo<string | null>(() => {
    const latestUnresolved = uiItems.find((item) => !item.resolved);
    return latestUnresolved ? latestUnresolved.id : null;
  }, [uiItems]);

  const handleUISubmit = useCallback(
    (componentId: string, response: string) => {
      setUiItems((prev) =>
        prev.map((item) =>
          item.id === componentId
            ? { ...item, resolved: true, resolvedText: response }
            : item,
        ),
      );
      handleSend(response);
    },
    [handleSend],
  );

  const handleCheckpointConfirm = useCallback(
    (accepted: boolean) => {
      confirmCheckpoint(accepted);
    },
    [confirmCheckpoint],
  );

  /**
   * Build the inverted item list. Active tool groups, action items and
   * GenUI items are pre-pended (newest first) so they appear at the
   * visual bottom of the inverted FlatList. Each list keeps its own
   * ordering by recency.
   */
  const items = useMemo<ReadonlyArray<ChatItem>>(() => {
    const messageItems: ChatItem[] = messages.map((m) => ({
      kind: 'message',
      message: m,
    }));
    const merged: ChatItem[] = [
      ...activeToolGroups,
      ...uiItems,
      ...actionItems,
      ...messageItems,
    ];
    return merged;
  }, [messages, actionItems, uiItems, activeToolGroups]);

  const renderItem = useCallback(
    ({ item }: { item: ChatItem }) => {
      if (item.kind === 'tool_group') {
        // Active groups stay expanded; once `endedAt` is set the card
        // becomes collapsible (the component itself manages local
        // expand/collapse state when uncontrolled).
        return (
          <ToolGroup
            groupId={item.id}
            steps={item.steps}
            collapsed={item.endedAt !== null ? true : false}
          />
        );
      }

      if (item.kind === 'ui') {
        const isActive = !item.resolved && item.id === activeUIComponentId;
        return (
          <View>
            {renderUIComponent(
              item.component,
              (response) => handleUISubmit(item.id, response),
              !isActive,
              item.resolvedText,
            )}
          </View>
        );
      }

      if (item.kind === 'action') {
        // The backend now emits `ui_component` for garmin_connect /
        // signup, so this branch is forward-compat only: any unknown
        // action_request still surfaces a generic disabled card rather
        // than silently dropping.
        return (
          <ActionCard
            label={item.label || 'Aktion'}
            onPress={() => {}}
            disabled
            variant="subtle"
          />
        );
      }

      const message = item.message;
      const footer =
        message.role === 'assistant' &&
        message.toolSteps &&
        message.toolSteps.length > 0 ? (
          <ShowWorkFooter steps={message.toolSteps} />
        ) : null;

      if (
        message.checkpointId &&
        pendingCheckpoint &&
        pendingCheckpoint.id === message.checkpointId
      ) {
        return (
          <View>
            <ChatBubble message={message} />
            {footer}
            <CheckpointCard
              checkpoint={pendingCheckpoint}
              onConfirm={handleCheckpointConfirm}
              isConfirming={isConfirming}
            />
          </View>
        );
      }

      if (footer) {
        return (
          <View>
            <ChatBubble message={message} />
            {footer}
          </View>
        );
      }

      return <ChatBubble message={message} />;
    },
    [
      pendingCheckpoint,
      isConfirming,
      handleCheckpointConfirm,
      activeUIComponentId,
      handleUISubmit,
    ],
  );

  const keyExtractor = useCallback((item: ChatItem) => {
    if (item.kind === 'message') {
      return item.message.id;
    }
    if (item.kind === 'ui') {
      return `ui-${item.id}`;
    }
    if (item.kind === 'tool_group') {
      return `toolgroup-${item.id}`;
    }
    return item.id;
  }, []);

  const showFreshSessionPlaceholder =
    messages.length === 0 &&
    actionItems.length === 0 &&
    uiItems.length === 0 &&
    activeToolGroups.length === 0;

  /**
   * Decision on the legacy AgentStatus chip: keep it for the
   * "Denke nach..." thinking-only phase, hide it whenever a tool group
   * card is on screen so we don't double up the status surface. The
   * checklist already conveys the active step richer than the chip.
   */
  const hasActiveToolGroup = activeToolGroups.length > 0;
  const showAgentStatus = (isTyping || isStreaming) && !hasActiveToolGroup;

  return (
    <View className="flex-1 bg-background">
      <GradientHeader
        title="Coach"
        rightContent={
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-success" />
            <Text className="text-white text-xs font-medium">Online</Text>
          </View>
        }
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {showFreshSessionPlaceholder ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-text-secondary text-base text-center leading-6">
              {FRESH_SESSION_PLACEHOLDER}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={items as ChatItem[]}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            inverted
            contentContainerClassName="px-4 py-2"
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}

        {quickReplies.length > 0 && !isTyping && (
          <QuickReplies replies={quickReplies} onSelect={handleQuickReply} />
        )}

        <AgentStatus
          isActive={showAgentStatus}
          status={agentStatus}
          tool={agentTool}
        />

        <ChatInput
          onSend={handleSend}
          onVoiceStart={voice.startListening}
          onVoiceStop={voice.stopListening}
          isListening={voice.isListening}
          voiceTranscript={voice.transcript}
          disabled={isStreaming}
          draft={activeDraft}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
