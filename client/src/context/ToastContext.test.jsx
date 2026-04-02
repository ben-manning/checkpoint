import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider } from './ToastContext';
import { useToast } from './useToast';

const ToastProbe = () => {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast.success('Saved!')}>toast-success</button>
      <button onClick={() => toast.error('Failed!')}>toast-error</button>
    </div>
  );
};

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders success and error toasts', () => {
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('toast-success'));
    fireEvent.click(screen.getByText('toast-error'));

    expect(screen.getByText('Saved!')).toBeInTheDocument();
    expect(screen.getByText('Failed!')).toBeInTheDocument();
  });

  it('dismisses a toast when close button is clicked', () => {
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('toast-success'));
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Dismiss notification'));
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });

  it('auto-dismisses toast after the timeout', () => {
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('toast-success'));
    expect(screen.getByText('Saved!')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(screen.queryByText('Saved!')).not.toBeInTheDocument();
  });
});
