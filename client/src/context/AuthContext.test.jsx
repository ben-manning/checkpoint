import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useAuth } from './useAuth';
import AuthProvider from './AuthContext';

const setAuthTokenMock = vi.fn();

vi.mock('../api/axios.js', () => ({
  setAuthToken: (...args) => setAuthTokenMock(...args),
}));

const Probe = () => {
  const { currentUser, token, login, logout } = useAuth();

  return (
    <div>
      <span data-testid='user-name'>{currentUser?.name || 'none'}</span>
      <span data-testid='token'>{token || 'none'}</span>
      <button
        onClick={() =>
          login({
            user: { id: 1, name: 'Auth User', email: 'auth@example.com' },
            token: 'jwt-token',
          })
        }
      >
        do-login
      </button>
      <button onClick={logout}>do-logout</button>
      <button onClick={() => login({ user: null, token: null })}>bad-login</button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    setAuthTokenMock.mockReset();
  });

  it('sets currentUser and token on login', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('do-login'));

    expect(screen.getByTestId('user-name')).toHaveTextContent('Auth User');
    expect(screen.getByTestId('token')).toHaveTextContent('jwt-token');
    expect(setAuthTokenMock).toHaveBeenCalledWith('jwt-token');
  });

  it('clears currentUser and token on logout', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('do-login'));
    fireEvent.click(screen.getByText('do-logout'));

    expect(screen.getByTestId('user-name')).toHaveTextContent('none');
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(setAuthTokenMock).toHaveBeenLastCalledWith(null);
  });

  it('ignores malformed login payloads', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('bad-login'));

    expect(screen.getByTestId('user-name')).toHaveTextContent('none');
    expect(screen.getByTestId('token')).toHaveTextContent('none');
    expect(setAuthTokenMock).not.toHaveBeenCalled();
  });

  it('does not call setAuthToken when logging out while already logged out', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    // Logout without ever logging in — the guard should prevent setAuthToken(null)
    fireEvent.click(screen.getByText('do-logout'));

    expect(setAuthTokenMock).not.toHaveBeenCalled();
  });
});
