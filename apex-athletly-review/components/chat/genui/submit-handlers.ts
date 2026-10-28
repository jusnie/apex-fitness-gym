/**
 * Submit Handler Registry - Athletly V2 GenUI
 *
 * Bridges the `text_input` GenUI component with native frontend actions.
 *
 * Contract:
 * - When `on_submit` on a `text_input` payload is null/missing, the form's
 *   values are serialized as a normal chat message ("name=value, ...") and
 *   sent back to the agent via the standard chat send flow.
 * - When `on_submit` is one of the known keys below, the registered handler
 *   runs the native side-effect (supabase auth, garmin connect, ...). The
 *   handler may return a `followupMessage` that the caller can send back to
 *   the agent as a regular user message so the agent stays in sync.
 *
 * On handler error: the TextInputCard surfaces the message inline and leaves
 * the card unresolved so the user can correct input and retry.
 */
import { supabase } from '@/lib/supabase';
import { apiPost } from '@/lib/api';

export type FieldValues = Readonly<Record<string, string>>;

export interface SubmitResult {
  /**
   * Optional chat message to send back to the agent after the native handler
   * succeeded. `null`/`undefined` means: do not send a follow-up. Use this
   * when the agent already knows the outcome (e.g. signup/login trigger an
   * auth-state change and the agent picks it up server-side) versus a plain
   * remote action that the agent only learns about via chat (garmin).
   */
  readonly followupMessage?: string | null;
}

export type SubmitHandler = (values: FieldValues) => Promise<SubmitResult>;

export const SUBMIT_HANDLERS: Readonly<Record<string, SubmitHandler>> = {
  signup: async ({ email, password }) => {
    const trimmedEmail = (email ?? '').trim();
    const { error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: password ?? '',
    });
    if (error) throw new Error(error.message);
    return { followupMessage: null };
  },

  login: async ({ email, password }) => {
    const trimmedEmail = (email ?? '').trim();
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: password ?? '',
    });
    if (error) throw new Error(error.message);
    return { followupMessage: null };
  },

  garmin_connect: async ({ email, password }) => {
    await apiPost('/garmin/connect', {
      email: (email ?? '').trim(),
      password: password ?? '',
    });
    return { followupMessage: 'Garmin verbunden.' };
  },
};

export function hasSubmitHandler(key: string | null | undefined): key is keyof typeof SUBMIT_HANDLERS {
  if (!key) return false;
  return Object.prototype.hasOwnProperty.call(SUBMIT_HANDLERS, key);
}
