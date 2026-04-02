import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Nav from './Nav';

const logoutMock = vi.fn();
const navigateMock = vi.fn();
const authState = { currentUser: null, logout: logoutMock };

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

describe('Nav', () => {
  beforeEach(() => {
    authState.currentUser = null;
    logoutMock.mockReset();
    navigateMock.mockReset();
  });

  it('shows login and register links when logged out', () => {
    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Log Out')).not.toBeInTheDocument();
  });

  it('shows user name and logout button when logged in', () => {
    authState.currentUser = { id: 1, name: 'Ben' };

    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    );

    expect(screen.getByText('Ben')).toBeInTheDocument();
    expect(screen.getByText('Log Out')).toBeInTheDocument();
  });

  it('logs out and navigates to login on logout click', () => {
    authState.currentUser = { id: 1, name: 'Ben' };

    render(
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Log Out'));

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/login');
  });

  it('marks Login as active on /login route', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Nav />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Login' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Register' })).not.toHaveClass('active');
  });

  it('marks Register as active on /register route', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Nav />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Register' })).toHaveClass('active');
    expect(screen.getByRole('link', { name: 'Login' })).not.toHaveClass('active');
  });
});
