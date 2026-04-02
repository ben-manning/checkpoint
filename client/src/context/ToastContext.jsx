import React from 'react';
import { createContext, useCallback, useMemo, useRef, useState } from 'react';

export const ToastContext = createContext(null);

let nextId = 0;
const DURATION_MS = 3500;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type) => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (msg) => addToast(msg, 'success'),
      error: (msg) => addToast(msg, 'error'),
    }),
    [addToast]
  );

  return (
    <ToastContext value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div className='toaster' role='region' aria-label='Notifications' aria-live='polite'>
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <span>{t.message}</span>
              <button
                type='button'
                className='toast-close'
                aria-label='Dismiss notification'
                onClick={() => dismiss(t.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext>
  );
};
