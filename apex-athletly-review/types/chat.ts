/**
 * Chat Types — Athletly V2
 *
 * Core types for chat messaging, SSE streaming, and checkpoints.
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  toolCalls?: string[];       // tool names used
  toolSteps?: ReadonlyArray<ToolStep>; // structured tool sequence for the "Show Work" footer
  checkpointId?: string;      // if this message has a checkpoint
  synced?: boolean;           // whether persisted to backend
}

/**
 * Status of a single tool step inside a tool group sequence.
 * Used by the multi-step checklist (ToolGroup) while a turn is running
 * and the "Show Work" footer (ShowWorkFooter) after the turn finishes.
 */
export type ToolStepStatus = 'pending' | 'running' | 'done' | 'error';

export interface ToolStep {
  readonly toolName: string;
  readonly displayLabel: string;
  readonly status: ToolStepStatus;
}

/**
 * Richer per-tool event payload exposed by useChatStream's onToolEvent
 * callback. Extends the legacy single-line status with the German label
 * and the owning group id so the UI can render a multi-step checklist.
 */
export interface ToolEvent {
  readonly name: string;
  readonly args: Record<string, unknown>;
  readonly displayLabel: string;
  readonly groupId: string;
}

export interface StreamProgress {
  status: string;
  tool?: string;
  timestamp: string;
}

export interface UsageStats {
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly provider?: string;
  readonly costUsd?: number;
  readonly latencyMs?: number;
}

export type ChatContext = 'coach' | 'onboarding';

export interface Checkpoint {
  id: string;
  type: 'SOFT' | 'HARD';
  preview: Record<string, unknown>;
}

export interface StreamMessage {
  content: string;
  sessionId: string;
}

/**
 * Action types the agent can request via the `action_request` SSE event.
 * Keep this aligned with the backend's action_type enum.
 */
export type ActionType = 'garmin_connect' | 'signup';

export interface ActionRequest {
  readonly type: ActionType | string;
  readonly label: string;
  readonly payload: Record<string, unknown>;
}

/**
 * Generative UI component payload as it arrives via the `ui_component` SSE
 * event. The frontend renders this inline in the chat history; the user's
 * answer is then sent back as a normal user message via the standard
 * sendMessage flow.
 *
 * The `props` field is intentionally loosely typed at the transport
 * boundary - the GenUI registry narrows on `type` before rendering.
 */
export type UIComponentType =
  | 'choice_single'
  | 'choice_multi'
  | 'number_stepper'
  | 'date_picker'
  | 'confirm'
  | 'text_input'
  | 'plan_preview';

export interface UIComponent {
  readonly type: UIComponentType;
  readonly id: string;
  readonly props: Record<string, unknown>;
}

/**
 * Chat history item discriminated union. A history slot is either a
 * normal message bubble, an inline action card requested by the agent,
 * an inline generative-UI component, or an in-flight tool group
 * checklist that becomes a ShowWorkFooter on the assistant message
 * once the group ends.
 */
export type ChatItem =
  | { readonly kind: 'message'; readonly message: ChatMessage }
  | {
      readonly kind: 'action';
      readonly id: string;
      readonly actionType: ActionType | string;
      readonly label: string;
      readonly payload: Record<string, unknown>;
      readonly timestamp: Date;
    }
  | {
      readonly kind: 'ui';
      readonly id: string;
      readonly component: UIComponent;
      readonly resolved: boolean;
      readonly resolvedText?: string;
      readonly timestamp: Date;
    }
  | {
      readonly kind: 'tool_group';
      readonly id: string;
      readonly steps: ReadonlyArray<ToolStep>;
      readonly endedAt: Date | null;
      readonly timestamp: Date;
    };
