import type { Role } from '../lib/access';
import type {
  BackendUser,
  LoginDto,
  LoginResponse,
  RefreshResponse,
  RegisterDto,
  RegisterResponse,
  ResetPasswordDto,
} from './backend';

/** The signed-in user. `role` is the single source of truth for the menu. */
export interface AuthUser {
  email: string;
  name: string;
  role: Role;
}

/** Backend shape of `GET /auth/me`. No role field — mapped to `AuthUser` client-side. */
export type AuthMeDto = BackendUser;

export interface LoginInput extends LoginDto {}

export interface RegisterInput extends RegisterDto {}

export interface RefreshInput {
  refreshToken: string;
}

export interface ResetPasswordInput extends ResetPasswordDto {}

/** Re-exports so callers can import backend auth contracts from one place. */
export type {
  LoginDto,
  LoginResponse,
  RefreshResponse,
  RegisterDto,
  RegisterResponse,
  ResetPasswordDto,
  BackendUser,
};

/**
 * Map a backend user (+ assumed role) to the UI session user.
 * Backend exposes no role; callers pass the resolved role explicitly.
 */
export function toAuthUser(me: BackendUser, role: Role): AuthUser {
  return { email: me.email, name: me.name, role };
}
