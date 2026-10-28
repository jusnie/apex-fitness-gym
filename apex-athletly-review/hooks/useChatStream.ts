/**
 * Chat Stream Hook - Athletly V2
 *
 * Streams chat responses from the Python backend via SSE.
 *
 * Event protocol (Python backend):
 *   session_start    -> {session_id}
 *   thinking         -> {text}
 *   tool_hint        -> {name, args, display_label, group_id}
 *   tool_result      -> {name, preview}
 *   tool_error       -> {detail}
 *   tool_group_start -> {group_id}
 *   tool_group_end   -> {group_id}
 *   message          -> {text, checkpoint?: {id, type, preview}}
 *   usage            -> {input_tokens, output_tokens, model}
 *   onboarding_complete -> {}
 *   action_request   -> {action_type, label, payload}
 *   ui_component     -> {type, id, props}
 *   error            -> {message, code}
 *   done             -> {}
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import type {
  StreamProgress,
  StreamMessage,
  UsageStats,
  ChatContext,
  Checkpoint,
  ActionRequest,
  UIComponent,
  UIComponentType,
  ToolEvent,
} from '@/types/chat';

import EventSource from 'react-native-sse';
import { setStreamActive } from '@/lib/chatActiveFlag';

/**
 * Custom SSE event types from the Python backend.
 */
type SSEEvents =
  | 'session_start'
  | 'thinking'
  | 'tool_hint'
  | 'tool_result'
  | 'tool_error'
  | 'tool_group_start'
  | 'tool_group_end'
  | 'usage'
  | 'onboarding_complete'
  | 'action_request'
  | 'ui_component'
  | 'done';

const VALID_UI_COMPONENT_TYPES: ReadonlyArray<UIComponentType> = [
  'choice_single',
  'choice_multi',
  'number_stepper',
  'date_picker',
  'confirm',
  'text_input',
  'plan_preview',
];

function isUIComponentType(value: unknown): value is UIComponentType {
  return (
    typeof value === 'string' &&
    (VALID_UI_COMPONENT_TYPES as ReadonlyArray<string>).includes(value)
  );
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://athletly.rnltlabs.de';

interface UseChatStreamResult {
  sendMessage: (
    message: string,
    sessionId: string,
    onMessage: (message: StreamMessage) => void,
    onProgress?: (progress: StreamProgress) => void,
    context?: ChatContext,
    onOnboardingComplete?: () => void,
    onCheckpoint?: (checkpoint: Checkpoint) => void,
    onActionRequest?: (action: ActionRequest) => void,
    onUIComponent?: (component: UIComponent) => void,
    onToolEvent?: (event: ToolEvent) => void,
    onToolGroupStart?: (groupId: string) => void,
    onToolGroupEnd?: (groupId: string) => void,
  ) => Promise<void>;
  isStreaming: boolean;
  progress: StreamProgress | null;
  toolsUsed: string[];
  usage: UsageStats | null;
  error: string | null;
  abort: () => void;
}

/**
 * Frontend fallback group id, used when the backend deploy hasn't shipped
 * `group_id` on `tool_hint` yet. One id per turn keeps the UI grouping
 * sensible without server cooperation.
 */
function makeFallbackGroupId(): string {
  return `local-group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useChatStream(): UseChatStreamResult {
  const session = useAuthStore((state) => state.session);
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState<StreamProgress | null>(null);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const abort = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsStreaming(false);
      setStreamActive(false);
      setProgress(null);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const sendMessage = useCallback(
    async (
      message: string,
      sessionId: string,
      onMessage: (message: StreamMessage) => void,
      onProgress?: (progress: StreamProgress) => void,
      context?: ChatContext,
      onOnboardingComplete?: () => void,
      onCheckpoint?: (checkpoint: Checkpoint) => void,
      onActionRequest?: (action: ActionRequest) => void,
      onUIComponent?: (component: UIComponent) => void,
      onToolEvent?: (event: ToolEvent) => void,
      onToolGroupStart?: (groupId: string) => void,
      onToolGroupEnd?: (groupId: string) => void,
    ) => {
      if (!session?.access_token) {
        setError('Nicht authentifiziert');
        throw new Error('Not authenticated');
      }

      // Abort any existing stream
      abort();

      setIsStreaming(true);
      setStreamActive(true);
      setProgress(null);
      setToolsUsed([]);
      setUsage(null);
      setError(null);

      const url = `${API_URL}/chat`;

      // Track session_id from the server (emitted via session_start event)
      let capturedSessionId = sessionId;

      // Per-turn fallback group id. Used only if the backend `tool_hint`
      // payload omits `group_id` (deploy mismatch). Once `tool_group_start`
      // arrives we adopt the server-provided id.
      let fallbackGroupId: string | null = null;
      const ensureFallbackGroupId = (): string => {
        if (fallbackGroupId === null) {
          fallbackGroupId = makeFallbackGroupId();
          onToolGroupStart?.(fallbackGroupId);
        }
        return fallbackGroupId;
      };

      return new Promise<void>((resolve, reject) => {
        try {
          const es = new EventSource<SSEEvents>(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message,
              session_id: sessionId,
              ...(context && { context }),
            }),
            pollingInterval: 0,
          });

          eventSourceRef.current = es;

          es.addEventListener('open', () => {
            console.log('[useChatStream] Connection opened');
          });

          es.addEventListener('session_start', (event: any) => {
            try {
              const data = JSON.parse(event.data);
              capturedSessionId = data.session_id;
              console.log('[useChatStream] Session:', capturedSessionId);
            } catch (e) {
              console.warn('[useChatStream] Failed to parse session_start:', e);
            }
          });

          es.addEventListener('thinking', (event: any) => {
            try {
              const data = JSON.parse(event.data);
              const prog: StreamProgress = {
                status: data.text || 'Denke nach...',
                timestamp: new Date().toISOString(),
              };
              setProgress(prog);
              onProgress?.(prog);
            } catch (e) {
              console.warn('[useChatStream] Failed to parse thinking:', e);
            }
          });

          es.addEventListener('tool_hint', (event: any) => {
            try {
              const data = JSON.parse(event.data);
              const name = typeof data.name === 'string' ? data.name : 'tool';
              const displayLabel =
                typeof data.display_label === 'string' && data.display_label.length > 0
                  ? data.display_label
                  : name;
              const groupId =
                typeof data.group_id === 'string' && data.group_id.length > 0
                  ? data.group_id
                  : ensureFallbackGroupId();
              const args =
                data.args && typeof data.args === 'object' ? data.args : {};

              const prog: StreamProgress = {
                status: displayLabel,
                tool: name,
                timestamp: new Date().toISOString(),
              };
              setProgress(prog);
              onProgress?.(prog);
              onToolEvent?.({
                name,
                args,
                displayLabel,
                groupId,
              });
            } catch (e) {
              console.warn('[useChatStream] Failed to parse tool_hint:', e);
            }
          });

          es.addEventListener('tool_group_start', (event: any) => {
            try {
              const data = JSON.parse(event.data);
              const groupId =
                typeof data.group_id === 'string' && data.group_id.length > 0
                  ? data.group_id
                  : makeFallbackGroupId();
              fallbackGroupId = groupId;
              onToolGroupStart?.(groupId);
            } catch (e) {
              console.warn('[useChatStream] Failed to parse tool_group_start:', e);
            }
          });

          es.addEventListener('tool_group_end', (event: any) => {
            try {
              const data = JSON.parse(event.data);
              const groupId =
                typeof data.group_id === 'string' && data.group_id.length > 0
                  ? data.group_id
                  : fallbackGroupId;
              if (groupId) {
                onToolGroupEnd?.(groupId);
              }
              if (groupId && groupId === fallbackGroupId) {
                fallbackGroupId = null;
              }
            } catch (e) {
              console.warn('[useChatStream] Failed to parse tool_group_end:', e);
            }
          });

          es.addEventListener('tool_result', (event: any) => {
            try {
              const data = JSON.parse(event.data);
              setToolsUsed((prev) => [...prev, data.name]);
            } catch (e) {
              console.warn('[useChatStream] Failed to parse tool_result:', e);
            }
          });

          es.addEventListener('tool_error', (event: any) => {
            try {
              const data = JSON.parse(event.data);
              const prog: StreamProgress = {
                status: `Tool error: ${data.detail || 'unknown'}`,
                timestamp: new Date().toISOString(),
              };
              setProgress(prog);
              onProgress?.(prog);
            } catch (e) {
              console.warn('[useChatStream] Failed to parse tool_error:', e);
            }
          });

          es.addEventListener('message', (event: any) => {
            try {
              const data = JSON.parse(event.data);
              onMessage({
                content: data.text,
                sessionId: capturedSessionId,
              });

              // Extract checkpoint if present in the message event
              if (data.checkpoint && typeof data.checkpoint === 'object') {
                const cp: Checkpoint = {
                  id: data.checkpoint.id,
                  type: data.checkpoint.type === 'SOFT' ? 'SOFT' : 'HARD',
                  preview: data.checkpoint.preview ?? {},
                };
                console.log('[useChatStream] Checkpoint received:', cp.id, cp.type);
                onCheckpoint?.(cp);
              }
            } catch (e) {
              console.warn('[useChatStream] Failed to parse message:', e);
            }
          });

          es.addEventListener('usage', (event: any) => {
            try {
              const data = JSON.parse(event.data);
              setUsage({
                model: data.model,
                inputTokens: data.input_tokens,
                outputTokens: data.output_tokens,
                provider: typeof data.provider === 'string' ? data.provider : undefined,
                costUsd: typeof data.cost_usd === 'number' ? data.cost_usd : undefined,
                latencyMs: typeof data.latency_ms === 'number' ? data.latency_ms : undefined,
              });
            } catch (e) {
              console.warn('[useChatStream] Failed to parse usage:', e);
            }
          });

          es.addEventListener('onboarding_complete', (event: any) => {
            try {
              const data = JSON.parse(event.data);
              console.log('[useChatStream] Onboarding complete:', data);
            } catch (e) {
              console.warn('[useChatStream] Failed to parse onboarding_complete:', e);
            }
            onOnboardingComplete?.();
          });

          es.addEventListener('action_request', (event: any) => {
            try {
              const data = JSON.parse(event.data);
              const action: ActionRequest = {
                type: data.action_type,
                label: typeof data.label === 'string' ? data.label : '',
                payload:
                  data.payload && typeof data.payload === 'object'
                    ? data.payload
                    : {},
              };
              console.log('[useChatStream] Action request:', action.type);
              onActionRequest?.(action);
            } catch (e) {
              console.warn('[useChatStream] Failed to parse action_request:', e);
            }
          });

          es.addEventListener('ui_component', (event: any) => {
            try {
              const data = JSON.parse(event.data);
              if (!isUIComponentType(data?.type)) {
                console.warn(
                  '[useChatStream] Ignoring ui_component with unknown type:',
                  data?.type,
                );
                return;
              }
              if (typeof data.id !== 'string' || data.id.length === 0) {
                console.warn('[useChatStream] Ignoring ui_component without id');
                return;
              }
              const component: UIComponent = {
                type: data.type,
                id: data.id,
                props:
                  data.props && typeof data.props === 'object'
                    ? data.props
                    : {},
              };
              console.log(
                '[useChatStream] UI component:',
                component.type,
                component.id,
              );
              onUIComponent?.(component);
            } catch (e) {
              console.warn('[useChatStream] Failed to parse ui_component:', e);
            }
          });

          es.addEventListener('error', (event: any) => {
            // When the app is backgrounded on iOS, the OS kills the SSE
            // connection. xhrStatus 200 + "connection was lost" means the
            // request was successful but the socket was dropped — treat
            // this as a graceful end, not an error.
            const isBackgroundDisconnect =
              event.xhrStatus === 200 &&
              typeof event.message === 'string' &&
              event.message.toLowerCase().includes('connection was lost');

            if (isBackgroundDisconnect) {
              console.log('[useChatStream] Connection lost (app backgrounded) — closing gracefully');
              es.close();
              setIsStreaming(false);
              setStreamActive(false);
              setProgress(null);
              eventSourceRef.current = null;
              resolve();
              return;
            }

            console.error('[useChatStream] SSE Error:', event);

            if (event.data) {
              try {
                const data = JSON.parse(event.data);
                setError(data.message || 'Stream-Fehler');
              } catch {
                setError('Verbindungsfehler');
              }
            } else {
              setError(event.message || 'Verbindungsfehler');
            }

            es.close();
            setIsStreaming(false);
            setStreamActive(false);
            setProgress(null);
            eventSourceRef.current = null;
            reject(new Error('Stream error'));
          });

          es.addEventListener('done', () => {
            console.log('[useChatStream] Stream complete');
            es.close();
            setIsStreaming(false);
            setStreamActive(false);
            setProgress(null);
            eventSourceRef.current = null;
            resolve();
          });
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
          setError(errorMessage);
          setIsStreaming(false);
          setProgress(null);
          console.error('[useChatStream] Error:', err);
          reject(err);
        }
      });
    },
    [session, abort],
  );

  return {
    sendMessage,
    isStreaming,
    progress,
    toolsUsed,
    usage,
    error,
    abort,
  };
}
