import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Home from './Home';

const navigateMock = vi.fn();
const authState = { currentUser: null };

vi.mock('../context/useAuth.jsx', () => ({
  useAuth: () => authState,
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('Home', () => {
  beforeEach(() => {
    authState.currentUser = null;
    navigateMock.mockReset();
  });

  it('renders hero content when user is not authenticated', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText('Stop wandering. Start hitting checkpoints.')).toBeInTheDocument();
    expect(screen.getByText('Start Your Journey')).toBeInTheDocument();
  });

  it('redirects authenticated user to dashboard', async () => {
    authState.currentUser = { id: 1, name: 'User' };

    const { container } = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    expect(container).toBeEmptyDOMElement();
  });
});
