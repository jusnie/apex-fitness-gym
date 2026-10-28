import { supabase } from './supabase';
import { log } from './logger';

const TAG = 'API';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://athletly.rnltlabs.de';
log.info(TAG, `Base URL: ${API_URL}`);

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const endTimer = log.time(TAG, 'getAuthHeaders');
  const { data: { session } } = await supabase.auth.getSession();
  endTimer();

  if (!session?.access_token) {
    log.error(TAG, 'Not authenticated — no access token');
    throw new Error('Not authenticated');
  }
  log.debug(TAG, 'Auth headers ready', {
    tokenPrefix: session.access_token.slice(0, 20) + '...',
  });
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

async function logResponse(method: string, path: string, response: Response): Promise<void> {
  if (!response.ok) {
    const body = await response.text().catch(() => '<unreadable>');
    log.error(TAG, `${method} ${path} → ${response.status}`, { body: body.slice(0, 500) });
  } else {
    log.info(TAG, `${method} ${path} → ${response.status}`);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const endTimer = log.time(TAG, `GET ${path}`);
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}${path}`, { headers });
    endTimer();
    await logResponse('GET', path, response);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  } catch (err) {
    endTimer();
    log.error(TAG, `GET ${path} failed`, { error: String(err) });
    throw err;
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const endTimer = log.time(TAG, `POST ${path}`);
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    endTimer();
    await logResponse('POST', path, response);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  } catch (err) {
    endTimer();
    log.error(TAG, `POST ${path} failed`, { error: String(err) });
    throw err;
  }
}

export async function apiPostPublic<T>(path: string, body?: unknown): Promise<T> {
  const endTimer = log.time(TAG, `POST (public) ${path}`);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    endTimer();
    await logResponse('POST', path, response);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  } catch (err) {
    endTimer();
    log.error(TAG, `POST (public) ${path} failed`, { error: String(err) });
    throw err;
  }
}

export async function apiDelete<T>(path: string): Promise<T> {
  const endTimer = log.time(TAG, `DELETE ${path}`);
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers,
    });
    endTimer();
    await logResponse('DELETE', path, response);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return response.json();
  } catch (err) {
    endTimer();
    log.error(TAG, `DELETE ${path} failed`, { error: String(err) });
    throw err;
  }
}

export { API_URL };
