import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Login from './Login';

const loginMock = vi.fn();
const navigateMock = vi.fn();
const postMock = vi.fn();

const locationState = { state: { from: { pathname: '/projects/12' } } };

vi.mock('../api/axios.js', () => ({
  default: {
    post: (...args) => postMock(...args),
  },
}));

vi.mock('../context/useAuth.jsx', () => ({
  useAuth: () => ({ login: loginMock }),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => locationState,
  };
});

describe('Login', () => {
  beforeEach(() => {
    loginMock.mockReset();
    navigateMock.mockReset();
    postMock.mockReset();
    locationState.state = { from: { pathname: '/projects/12' } };
  });

  it('submits credentials and navigates to the previous route on success', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        token: 'jwt-token',
        user: { id: 1, name: 'User', email: 'user@example.com' },
      },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/auth/login', {
        email: 'user@example.com',
        password: 'secret123',
      });
    });

    expect(loginMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/projects/12', { replace: true });
  });

  it('shows API error messages when request fails with message', async () => {
    postMock.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('shows fallback error message when API message is missing', async () => {
    postMock.mockRejectedValueOnce({});

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    expect(await screen.findByText('Unable to login with those credentials')).toBeInTheDocument();
  });

  it('defaults to navigating to /dashboard when no from location state is set', async () => {
    locationState.state = null;
    postMock.mockResolvedValueOnce({
      data: {
        token: 'jwt-token',
        user: { id: 1, name: 'User', email: 'user@example.com' },
      },
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
