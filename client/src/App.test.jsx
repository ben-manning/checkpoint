import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App';

const logoutMock = vi.fn();
const navigateMock = vi.fn();
let unauthorizedHandler;

vi.mock('./components/Nav.jsx', () => ({
  default: () => <div>Nav</div>,
}));
vi.mock('./components/Home.jsx', () => ({
  default: () => <div>Home Page</div>,
}));
vi.mock('./components/Dashboard.jsx', () => ({
  default: () => <div>Dashboard Page</div>,
}));
vi.mock('./components/ProjectDetails.jsx', () => ({
  default: () => <div>Project Details Page</div>,
}));
vi.mock('./components/Login.jsx', () => ({
  default: () => <div>Login Page</div>,
}));
vi.mock('./components/Register.jsx', () => ({
  default: () => <div>Register Page</div>,
}));

const authState = {
  currentUser: null,
  logout: logoutMock,
};

vi.mock('./context/useAuth.jsx', () => ({
  useAuth: () => authState,
}));

vi.mock('./api/axios.js', () => ({
  setOnUnauthorized: (fn) => {
    unauthorizedHandler = fn;
  },
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('App routing and auth guard', () => {
  beforeEach(() => {
    authState.currentUser = null;
    logoutMock.mockReset();
    navigateMock.mockReset();
    unauthorizedHandler = undefined;
  });

  it('redirects unauthenticated users from /dashboard to /login', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
  });

  it('renders protected routes when authenticated', async () => {
    authState.currentUser = { id: 1, name: 'Test' };

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument();
  });

  it('logs out and redirects on unauthorized callback', async () => {
    authState.currentUser = { id: 1, name: 'Test' };

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );

    expect(typeof unauthorizedHandler).toBe('function');

    unauthorizedHandler();

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('redirects unauthenticated users from /projects/:id to /login', async () => {
    render(
      <MemoryRouter initialEntries={['/projects/42']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Project Details Page')).not.toBeInTheDocument();
  });

  it('renders ProjectDetails for authenticated users at /projects/:id', async () => {
    authState.currentUser = { id: 1, name: 'Test' };

    render(
      <MemoryRouter initialEntries={['/projects/42']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Project Details Page')).toBeInTheDocument();
  });
});
