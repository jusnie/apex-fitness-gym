/**
 * Module-level flag tracking whether the chat SSE stream is active.
 *
 * Used by the push notification handler to suppress "coach replied"
 * notifications while the user is actively watching the response stream.
 *
 * This lives outside React state so it can be read synchronously from
 * the Expo notification handler (which runs at module scope).
 */

let _streamActive = false;

export function setStreamActive(active: boolean): void {
  _streamActive = active;
}

export function isStreamActive(): boolean {
  return _streamActive;
}
