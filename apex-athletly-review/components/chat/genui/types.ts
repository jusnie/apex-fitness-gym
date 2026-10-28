/**
 * GenUI Types - Athletly V2
 *
 * Types for the `ui_component` SSE event payload emitted by the backend
 * agent. Each component type has its own props shape. The frontend renders
 * the matching React Native component inline in the chat and emits a normal
 * user message when the user submits.
 *
 * Locked contract - keep in sync with the backend tools that emit this.
 */

export type UIComponentType =
  | 'choice_single'
  | 'choice_multi'
  | 'number_stepper'
  | 'date_picker'
  | 'confirm'
  | 'text_input'
  | 'plan_preview';

export interface ChoiceSingleProps {
  readonly question: string;
  readonly options: ReadonlyArray<string>;
  readonly submit_label?: string;
}

export interface ChoiceMultiProps {
  readonly question: string;
  readonly options: ReadonlyArray<string>;
  readonly submit_label?: string;
}

export interface NumberStepperProps {
  readonly question: string;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly initial?: number;
  readonly unit?: string;
  readonly submit_label?: string;
}

export interface DatePickerProps {
  readonly question: string;
  readonly min_date?: string;
  readonly max_date?: string;
  readonly initial_date?: string;
  readonly submit_label?: string;
}

export interface ConfirmProps {
  readonly question: string;
  readonly confirm_label?: string;
  readonly cancel_label?: string;
}

export type TextInputFieldType = 'text' | 'email' | 'password';

export interface TextInputFieldSpec {
  readonly name: string;
  readonly label: string;
  readonly placeholder?: string;
  readonly type?: TextInputFieldType;
  readonly isPassword?: boolean;
}

/**
 * `on_submit` is the bridge between agent-driven and frontend-driven forms.
 * - null/missing: serialize values as a chat message and let the agent
 *   continue the conversation.
 * - one of the keys in SUBMIT_HANDLERS: run a native side-effect (auth,
 *   garmin connect, etc.) and only emit a follow-up message if the handler
 *   asks for one.
 */
export interface TextInputProps {
  readonly question: string;
  readonly fields: ReadonlyArray<TextInputFieldSpec>;
  readonly submit_label?: string;
  readonly on_submit?: string | null;
}

export interface PlanPreviewSessionProps {
  readonly day?: string;
  readonly date?: string;
  readonly sport?: string;
  readonly name?: string;
  readonly description?: string;
  readonly duration_minutes?: number;
  readonly intensity?: string;
  readonly steps?: ReadonlyArray<unknown>;
  readonly notes?: string;
}

export interface PlanPreviewProps {
  readonly plan_id: string;
  readonly start_date?: string;
  readonly focus?: string;
  readonly sessions: ReadonlyArray<PlanPreviewSessionProps>;
  readonly truncated_in_ui?: boolean;
}

/**
 * Raw UI component payload as it arrives from the SSE event. The `props`
 * field is intentionally loosely typed here; the registry narrows on the
 * `type` discriminator before passing to the concrete component.
 */
export interface UIComponent {
  readonly type: UIComponentType;
  readonly id: string;
  readonly props: Record<string, unknown>;
}
