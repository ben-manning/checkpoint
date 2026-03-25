import { useContext } from 'react';
import { ToastContext } from './ToastContext.jsx';

export const useToast = () => useContext(ToastContext).toast;
