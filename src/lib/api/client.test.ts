import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  api,
  ApiError,
  buildUrlWithParams,
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  onUnauthorized,
  setAuthTokens,
} from './client';

describe('client.ts', () => {
  beforeEach(() => {
    sessionStorage.clear();
    clearAuthTokens();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildUrlWithParams', () => {
    it('appends query parameters cleanly', () => {
      const url = buildUrlWithParams('/students', { page: 1, limit: 20, name: 'Grace' });
      expect(url).toBe('/students?page=1&limit=20&name=Grace');
    });

    it('ignores undefined, null, and empty string parameters', () => {
      const url = buildUrlWithParams('/students', {
        page: 2,
        limit: undefined,
        name: '',
        school: null,
      });
      expect(url).toBe('/students?page=2');
    });

    it('handles paths with existing query parameters', () => {
      const url = buildUrlWithParams('/students?active=true', { page: 3 });
      expect(url).toBe('/students?active=true&page=3');
    });
  });

  describe('Token storage in sessionStorage', () => {
    it('saves and reads tokens from memory and sessionStorage', () => {
      setAuthTokens('access-123', 'refresh-456');
      expect(getAuthToken()).toBe('access-123');
      expect(getRefreshToken()).toBe('refresh-456');
      expect(sessionStorage.getItem('vf-mis.token')).toBe('access-123');
      expect(sessionStorage.getItem('vf-mis.refresh-token')).toBe('refresh-456');

      clearAuthTokens();
      expect(getAuthToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();
      expect(sessionStorage.getItem('vf-mis.token')).toBeNull();
      expect(sessionStorage.getItem('vf-mis.refresh-token')).toBeNull();
    });
  });

  describe('ApiError and response handling', () => {
    it('correctly formats error messages and status codes', () => {
      const err = new ApiError('Something broke', 400, { detail: 'bad input' });
      expect(err.message).toBe('Something broke');
      expect(err.status).toBe(400);
      expect(err.details).toEqual({ detail: 'bad input' });
    });
  });

  describe('HTTP operations & response envelope unwrapping', () => {
    it('unwraps NestJS { statusCode, data } responses', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          statusCode: 200,
          data: [{ id: '1', name: 'Ada Lovelace' }],
        }),
      } as Response);

      const res = await api.get<Array<{ id: string; name: string }>>('/users');
      expect(res).toEqual([{ id: '1', name: 'Ada Lovelace' }]);
    });

    it('attaches the Bearer token to request headers', async () => {
      setAuthTokens('my-jwt-token');

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          statusCode: 200,
          data: { email: 'test@example.com' },
        }),
      } as Response);

      await api.get('/auth/me');

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-jwt-token',
          }),
        }),
      );
    });
  });

  describe('Concurrent 401 Token Refresh Mutex', () => {
    it('serializes concurrent 401s so /auth/refresh is called only once', async () => {
      setAuthTokens('expired-access-token', 'valid-refresh-token');

      let refreshCount = 0;

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
        const url = String(input);

        if (url.includes('/auth/refresh')) {
          refreshCount++;
          // Simulate slight network latency
          await new Promise((r) => setTimeout(r, 20));
          return {
            ok: true,
            status: 200,
            json: async () => ({
              statusCode: 200,
              data: {
                accessToken: 'fresh-access-token',
                refreshToken: 'fresh-refresh-token',
              },
            }),
          } as Response;
        }

        const authHeader = (init?.headers as Record<string, string>)?.Authorization;

        if (authHeader === 'Bearer fresh-access-token') {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              statusCode: 200,
              data: { success: true, url },
            }),
          } as Response;
        }

        // Initially returns 401 for expired token
        return {
          ok: false,
          status: 401,
          json: async () => ({ statusCode: 401, message: 'Expired token' }),
        } as Response;
      });

      // Fire 3 simultaneous API requests that all hit 401
      const [res1, res2, res3] = await Promise.all([
        api.get<{ success: boolean }>('/stats/overview'),
        api.get<{ success: boolean }>('/stats/reach'),
        api.get<{ success: boolean }>('/users'),
      ]);

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
      expect(res3.success).toBe(true);

      // Verify the singleton mutex ensured exactly ONE refresh call occurred!
      expect(refreshCount).toBe(1);
      expect(getAuthToken()).toBe('fresh-access-token');
      expect(getRefreshToken()).toBe('fresh-refresh-token');
    });

    it('notifies unauthorized listeners and clears tokens when refresh fails', async () => {
      setAuthTokens('expired-access-token', 'dead-refresh-token');

      const unauthorizedSpy = vi.fn();
      const unsubscribe = onUnauthorized(unauthorizedSpy);

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = String(input);
        if (url.includes('/auth/refresh')) {
          return {
            ok: false,
            status: 401,
            json: async () => ({ statusCode: 401, message: 'Invalid refresh token' }),
          } as Response;
        }

        return {
          ok: false,
          status: 401,
          json: async () => ({ statusCode: 401, message: 'Expired' }),
        } as Response;
      });

      await expect(api.get('/stats/overview')).rejects.toThrow(ApiError);

      expect(unauthorizedSpy).toHaveBeenCalledTimes(1);
      expect(getAuthToken()).toBeNull();
      expect(getRefreshToken()).toBeNull();

      unsubscribe();
    });
  });
});
