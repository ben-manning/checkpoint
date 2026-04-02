import { describe, expect, it, vi } from 'vitest';
import api, { setAuthToken, setOnUnauthorized } from './axios';

describe('api axios interceptors', () => {
  it('adds authorization header when auth token is set', async () => {
    setAuthToken('abc123');
    const requestHandler = api.interceptors.request.handlers[0].fulfilled;

    const config = await requestHandler({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer abc123');
  });

  it('does not add authorization header when token is null', async () => {
    setAuthToken(null);
    const requestHandler = api.interceptors.request.handlers[0].fulfilled;

    const config = await requestHandler({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });

  it('creates headers object when missing and token exists', async () => {
    setAuthToken('xyz789');
    const requestHandler = api.interceptors.request.handlers[0].fulfilled;

    const config = await requestHandler({});
    expect(config.headers.Authorization).toBe('Bearer xyz789');
  });

  it('calls onUnauthorized on 401 responses', async () => {
    const onUnauthorized = vi.fn();
    setOnUnauthorized(onUnauthorized);

    const responseHandler = api.interceptors.response.handlers[0].rejected;

    await expect(
      responseHandler({ response: { status: 401 } })
    ).rejects.toEqual({ response: { status: 401 } });

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not call onUnauthorized for non-401 errors', async () => {
    const onUnauthorized = vi.fn();
    setOnUnauthorized(onUnauthorized);

    const responseHandler = api.interceptors.response.handlers[0].rejected;

    await expect(
      responseHandler({ response: { status: 500 } })
    ).rejects.toEqual({ response: { status: 500 } });

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('does not crash when 401 occurs and no unauthorized callback is set', async () => {
    setOnUnauthorized(null);
    const responseHandler = api.interceptors.response.handlers[0].rejected;

    await expect(
      responseHandler({ response: { status: 401 } })
    ).rejects.toEqual({ response: { status: 401 } });
  });
});
