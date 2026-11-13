import { API_BASE_URL } from './config';

/**
 * Token store. Memory-first, mirrored to localStorage so a refresh keeps the
 * session. The backend only ever sees it via the `Authorization` header that
 * `apiRequest()` attaches — components never touch the token directly.
 */
const TOKEN_KEY = 'vf-mis.token';
const REFRESH_TOKEN_KEY = 'vf-mis.refresh-token';

let memoryToken: string | null = null;
let memoryRefreshToken: string | null = null;

export function setAuthTokens(accessToken: string | null, refreshToken: string | null = null) {
  memoryToken = accessToken;
  memoryRefreshToken = refreshToken;
  try {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    else localStorage.removeItem(TOKEN_KEY);

    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    /* storage unavailable (private mode) — memory still works for the session */
  }
}

export function setAuthToken(token: string | null) {
  setAuthTokens(token, getRefreshToken());
}

export function getAuthToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    memoryToken = localStorage.getItem(TOKEN_KEY);
  } catch {
    memoryToken = null;
  }
  return memoryToken;
}

export function getRefreshToken(): string | null {
  if (memoryRefreshToken) return memoryRefreshToken;
  try {
    memoryRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    memoryRefreshToken = null;
  }
  return memoryRefreshToken;
}

export function clearAuthTokens() {
  setAuthTokens(null, null);
}

/** A failed HTTP request, keeping the status so callers can react to it. */
export class ApiError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Thin `fetch` wrapper for the backend. Prefixes the configured base URL,
 * attaches the session token when one exists, and normalises error handling /
 * JSON parsing. Swap or extend this one function (refresh tokens,
 * interceptors…) and every resource follows.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError('No backend is configured (VITE_API_BASE_URL is empty).');
  }

  const requestWithToken = async (token: string | null, isRetry = false): Promise<Response> => {
    return fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    }).then(async (res) => {
      if (res.status === 401 && !isRetry && path !== '/auth/refresh' && path !== '/auth/login') {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          clearAuthTokens();
          throw new ApiError('Your session has expired. Please sign in again.', 401);
        }

        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshBody = await refreshRes.json();
            const refreshData = refreshBody && typeof refreshBody === 'object' && 'data' in refreshBody ? refreshBody.data : refreshBody;
            const nextAccessToken = typeof refreshData?.accessToken === 'string' ? refreshData.accessToken : null;
            const nextRefreshToken = typeof refreshData?.refreshToken === 'string' ? refreshData.refreshToken : refreshToken;

            if (nextAccessToken) {
              setAuthTokens(nextAccessToken, nextRefreshToken);
              return requestWithToken(nextAccessToken, true);
            }
          }
        } catch {
          // Fall through to final auth error below.
        }

        clearAuthTokens();
        throw new ApiError('Your session has expired. Please sign in again.', 401);
      }

      return res;
    });
  };

  const res = await requestWithToken(getAuthToken());

  if (res.status === 401) {
    clearAuthTokens();
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }

  if (!res.ok) {
    let detail = '';
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) detail = `: ${body.message}`;
    } catch {
      /* non-JSON error body — fall through to the generic message */
    }
    throw new ApiError(`Request to ${path} failed${detail}`, res.status);
  }
  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json();

  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: T }).data;
  }

  return data as T;
}

