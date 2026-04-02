import { MemoryRouter } from 'react-router';
import AuthProvider from '../context/AuthContext.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import { render } from '@testing-library/react';

export const renderWithProviders = (ui, { route = '/' } = {}) =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
