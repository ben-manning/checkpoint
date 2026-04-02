import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Register from './Register';

const loginMock = vi.fn();
const navigateMock = vi.fn();
const postMock = vi.fn();

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
  };
});

describe('Register', () => {
  beforeEach(() => {
    loginMock.mockReset();
    navigateMock.mockReset();
    postMock.mockReset();
  });

  it('prevents submit when passwords do not match', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
      target: { value: 'secret124' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });

  it('submits registration payload and navigates to dashboard on success', async () => {
    postMock.mockResolvedValueOnce({
      data: {
        token: 'jwt-token',
        user: { id: 1, name: 'User', email: 'user@example.com' },
      },
    });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(postMock).toHaveBeenCalledWith('/auth/register', {
        name: 'User',
        email: 'user@example.com',
        password: 'secret123',
      });
    });

    expect(loginMock).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('shows API error messages and fallback messages', async () => {
    postMock.mockRejectedValueOnce({ response: { data: { message: 'Email already registered' } } });

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
  });

  it('shows fallback error message when API message is missing', async () => {
    postMock.mockRejectedValueOnce({});

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Name'), {
      target: { value: 'User' },
    });
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'secret123' },
    });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Unable to register with those details')).toBeInTheDocument();
  });
});
