/**
 * Auth resource.
 *
 * UI-only mode (no `VITE_API_BASE_URL`): demo sign-in against three built-in
 * personas, so the login page, role menus and guards can all be exercised
 * with no backend. With a backend configured these same functions hit the
 * real endpoints — no component changes needed.
 *
 * Expected backend contract (suggested):
 *   POST /auth/login  { email, password } -> { token, user: { email, name, role } }
 *   GET  /auth/me                           -> { email, name, role } (Bearer token)
 *   POST /auth/logout                       -> 204 (best-effort on sign-out)
 */
import type { AuthUser, LoginInput } from '../../types/auth';
import { roleLabel, type Role } from '../access';
import { isBackendConfigured } from './config';
import {
  api,
  ApiError,
  clearAuthTokens,
  getAuthToken,
  setAuthTokens,
} from './client';

const SESSION_KEY = 'vf-mis.session';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Demo directory used only while there is no backend. */
const DEMO_USERS: Record<Role, { email: string; name: string }> = {
  admin: { email: 'key.staff@visiola.local', name: 'Key staff (demo)' },
  staff: { email: 'programme.staff@visiola.local', name: 'Programme staff (demo)' },
  board: { email: 'board@visiola.local', name: 'Board member (demo)' },
};

export function demoUserFor(role: Role): AuthUser {
  const d = DEMO_USERS[role];
  return { email: d.email, name: d.name, role };
}

export function demoEmailFor(role: Role): string {
  return DEMO_USERS[role].email;
}

export function normalizeRole(value: unknown): Role {
  const raw = String(value ?? '').trim().toLowerCase();

  if (raw === 'admin' || raw === 'key_staff' || (raw.includes('key') && raw.includes('staff'))) {
    return 'admin';
  }
  if (raw === 'staff' || raw === 'programme_staff' || raw.includes('programme') || raw.includes('staff')) {
    return 'staff';
  }
  if (raw === 'board' || raw.includes('board')) {
    return 'board';
  }

  return 'staff';
}

function readStoredSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (typeof parsed.email === 'string') {
      const role = normalizeRole(parsed.role);
      return {
        email: parsed.email,
        name: typeof parsed.name === 'string' ? parsed.name : parsed.email,
        role,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredSession(user: AuthUser | null) {
  try {
    if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable — session still lives in the query cache */
  }
}

interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  user?: { email?: string; name?: string; role?: string };
}

/**
 * Sign in. UI-only: accepts any password (min 1 char) for one of the demo
 * emails, or an explicit demo role from the login form. Backend: the server
 * decides the role from the credentials — the client never assigns it.
 */
export async function login(input: LoginInput, demoRole?: Role): Promise<AuthUser> {
  const email = input.email.trim();
  if (!email || !input.password) {
    throw new ApiError('Enter your email and password.', 400);
  }

  if (!isBackendConfigured) {
    await delay(600); // keep the loading state honest in demos
    if (demoRole) {
      const user: AuthUser = { ...demoUserFor(demoRole), email };
      setAuthTokens('demo-token', 'demo-refresh-token');
      writeStoredSession(user);
      return user;
    }
    const match = (Object.keys(DEMO_USERS) as Role[]).find(
      (r) => DEMO_USERS[r].email.toLowerCase() === email.toLowerCase(),
    );
    if (!match) {
      throw new ApiError(
        'Unknown demo account. Use one of the demo emails shown on this page.',
        401,
      );
    }
    const user: AuthUser = { ...demoUserFor(match), email };
    setAuthTokens('demo-token', 'demo-refresh-token');
    writeStoredSession(user);
    return user;
  }

  const res = await api.post<LoginResponse>('/auth/login', {
    email,
    password: input.password,
  });

  const token =
    typeof res.accessToken === 'string'
      ? res.accessToken
      : typeof res.token === 'string'
        ? res.token
        : null;

  const refreshToken = typeof res.refreshToken === 'string' ? res.refreshToken : null;

  if (!token) {
    throw new ApiError('The server did not return an authentication token.', 401);
  }

  setAuthTokens(token, refreshToken);

  let backendUser = res.user;
  if (!backendUser || !backendUser.email) {
    try {
      backendUser = await api.get<{ email?: string; name?: string; role?: string }>('/auth/me');
    } catch {
      // If fetching profile fails, fallback to login input email
      backendUser = { email, name: email, role: 'staff' };
    }
  }

  const resolvedRole: Role = normalizeRole(backendUser.role ?? demoRole ?? 'staff');

  const user: AuthUser = {
    email: backendUser.email ?? email,
    name: backendUser.name ?? email,
    role: resolvedRole,
  };

  writeStoredSession(user);
  return user;
}

/**
 * Restore the session on load. UI-only: the stored demo user. Backend: the
 * stored user, revalidated against `GET /auth/me` when a token exists.
 */
export async function restoreSession(): Promise<AuthUser | null> {
  const stored = readStoredSession();
  if (!isBackendConfigured) {
    if (!stored) {
      const token = getAuthToken();
      if (token) clearAuthTokens();
      return null;
    }
    return stored;
  }

  const token = getAuthToken();
  if (!stored || !token) {
    clearAuthTokens();
    writeStoredSession(null);
    return null;
  }

  try {
    const me = await api.get<{ email?: string; name?: string; role?: string }>('/auth/me');
    const normalized = {
      email: me?.email ?? stored.email,
      name: me?.name ?? stored.name,
      role: normalizeRole(me?.role ?? stored.role),
    };
    if (!normalized.email) return null;
    writeStoredSession(normalized);
    return normalized;
  } catch {
    clearAuthTokens();
    writeStoredSession(null);
    return null;
  }
}

/** Sign out: tell the server (best-effort), then drop token + stored session. */
export async function logout(): Promise<void> {
  if (isBackendConfigured) {
    try {
      await api.post<void>('/auth/logout');
    } catch {
      /* signing out locally is what matters — a dead token is harmless */
    }
  }
  clearAuthTokens();
  writeStoredSession(null);
}

export function sessionRoleLabel(user: AuthUser): string {
  return `${user.name} · ${roleLabel(user.role)}`;
}
