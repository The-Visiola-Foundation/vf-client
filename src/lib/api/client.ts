import { API_BASE_URL } from './config';
import type { RefreshTokenDto, RefreshResponse } from '../../types/backend';

/**
 * Token store. Memory-first, mirrored to sessionStorage so a refresh keeps the
 * session for the tab while closing the tab securely clears it.
 */
const TOKEN_KEY = 'vf-mis.token';
const REFRESH_TOKEN_KEY = 'vf-mis.refresh-token';

let memoryToken: string | null = null;
let memoryRefreshToken: string | null = null;

type UnauthorizedHandler = () => void;
const unauthorizedListeners = new Set<UnauthorizedHandler>();

export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedListeners.add(handler);
  return () => {
    unauthorizedListeners.delete(handler);
  };
}

function notifyUnauthorized() {
  for (const listener of unauthorizedListeners) {
    try {
      listener();
    } catch (err) {
      console.error('Error in onUnauthorized listener:', err);
    }
  }
}

export function setAuthTokens(accessToken: string | null, refreshToken: string | null = null) {
  memoryToken = accessToken;
  memoryRefreshToken = refreshToken;
  try {
    if (accessToken) sessionStorage.setItem(TOKEN_KEY, accessToken);
    else sessionStorage.removeItem(TOKEN_KEY);

    if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    else sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    /* storage unavailable (e.g. private mode) — memory still works for the session */
  }
}

export function setAuthToken(token: string | null) {
  setAuthTokens(token, getRefreshToken());
}

export function getAuthToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    memoryToken = sessionStorage.getItem(TOKEN_KEY);
  } catch {
    memoryToken = null;
  }
  return memoryToken;
}

export function getRefreshToken(): string | null {
  if (memoryRefreshToken) return memoryRefreshToken;
  try {
    memoryRefreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    memoryRefreshToken = null;
  }
  return memoryRefreshToken;
}

export function clearAuthTokens() {
  setAuthTokens(null, null);
}

/** A failed HTTP request, preserving status, error code, and validation details. */
export class ApiError extends Error {
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly details: unknown;

  constructor(message: string, status?: number, details?: unknown, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const b = body as { message?: string | string[]; error?: string };
    if (Array.isArray(b.message)) {
      return b.message.filter(Boolean).join(', ');
    }
    if (typeof b.message === 'string' && b.message.trim()) {
      return b.message;
    }
    if (typeof b.error === 'string' && b.error.trim()) {
      return b.error;
    }
  }
  return fallback;
}

/**
 * Singleton in-flight promise for token refresh.
 * Serializes all concurrent 401s so only one request calls /auth/refresh.
 */
let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
      clearAuthTokens();
      notifyUnauthorized();
      return null;
    }

    const body: RefreshTokenDto = { refreshToken: currentRefreshToken };
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch (netErr) {
      // Network error: do not clear tokens, do not sign out.
      // Fail the request so the caller can retry later.
      refreshPromise = null;
      throw netErr;
    }

    try {
      // Only a 401/403 rejection of the refresh token signs the user out.
      // A 5xx or other error keeps tokens intact and throws for the caller.
      if (res.status === 401 || res.status === 403) {
        clearAuthTokens();
        notifyUnauthorized();
        return null;
      }

      if (!res.ok) {
        throw new ApiError(
          `Token refresh failed (HTTP ${res.status})`,
          res.status,
          undefined,
          'refresh_failed',
        );
      }

      const raw = await res.json();
      const payload: RefreshResponse =
        raw && typeof raw === 'object' && 'data' in raw
          ? (raw as { data: RefreshResponse }).data
          : (raw as RefreshResponse);

      const nextAccess =
        typeof payload.accessToken === 'string'
          ? payload.accessToken
          : typeof (payload as unknown as Record<string, unknown>).token === 'string'
            ? ((payload as unknown as Record<string, unknown>).token as string)
            : null;

      const nextRefresh =
        typeof payload.refreshToken === 'string'
          ? payload.refreshToken
          : currentRefreshToken;

      if (!nextAccess) {
        clearAuthTokens();
        notifyUnauthorized();
        return null;
      }

      setAuthTokens(nextAccess, nextRefresh);
      return nextAccess;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export function buildUrlWithParams(path: string, params?: Record<string, unknown>): string {
  if (!params) return path;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      qs.set(key, String(value));
    }
  }
  const str = qs.toString();
  return str ? `${path}${path.includes('?') ? '&' : '?'}${str}` : path;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, unknown>;
  body?: unknown;
}

/**
 * Core dispatch function. Attaches auth header, handles refresh on 401 via mutex,
 * normalizes NestJS response envelopes, and parses errors.
 */
async function executeRequest<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError('No backend is configured (VITE_API_BASE_URL is empty).');
  }

  const fullPath = buildUrlWithParams(path, options.params);
  const token = getAuthToken();

  const isBodyJson =
    options.body !== undefined &&
    !(options.body instanceof FormData) &&
    !(options.body instanceof Blob);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(isBodyJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const body = isBodyJson ? JSON.stringify(options.body) : (options.body as BodyInit | undefined);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${fullPath}`, {
      ...options,
      headers,
      body,
    });
  } catch (netErr) {
    throw new ApiError(
      netErr instanceof Error ? netErr.message : 'Network request failed',
      undefined,
      netErr,
    );
  }

  // Handle 401 Unauthorized
  if (
    res.status === 401 &&
    !isRetry &&
    !path.startsWith('/auth/login') &&
    !path.startsWith('/auth/refresh') &&
    !path.startsWith('/auth/logout')
  ) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      return executeRequest<T>(path, options, true);
    }
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }

  if (res.status === 401) {
    clearAuthTokens();
    notifyUnauthorized();
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }

  if (!res.ok) {
    let errorBody: unknown = null;
    try {
      errorBody = await res.json();
    } catch {
      /* non-JSON body */
    }
    const message = extractErrorMessage(errorBody, `Request to ${path} failed (HTTP ${res.status})`);
    throw new ApiError(message, res.status, errorBody);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const rawData = await res.json();

  // NestJS response envelope unwrapping ({ statusCode, data, message })
  if (rawData && typeof rawData === 'object' && 'data' in rawData) {
    return (rawData as { data: T }).data;
  }

  return rawData as T;
}

/**
 * Modern typed HTTP client.
 */
export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return executeRequest<T>(path, { ...options, method: 'GET' });
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return executeRequest<T>(path, { ...options, method: 'POST', body });
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return executeRequest<T>(path, { ...options, method: 'PATCH', body });
  },

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return executeRequest<T>(path, { ...options, method: 'DELETE' });
  },

  request<T>(path: string, options?: RequestOptions): Promise<T> {
    return executeRequest<T>(path, options);
  },
};

/**
 * Backward-compatible apiRequest wrapper.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let parsedBody: unknown = init.body;
  if (typeof init.body === 'string') {
    try {
      parsedBody = JSON.parse(init.body);
    } catch {
      parsedBody = init.body;
    }
  }

  return executeRequest<T>(path, {
    ...init,
    body: parsedBody,
  });
}
