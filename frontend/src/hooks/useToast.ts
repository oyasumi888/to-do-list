import { useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

  const showToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, title, message }]);

    if (type !== 'loading') {
      setTimeout(() => removeToast(id), 3000);
    }

    return id;
  }, []);

  

  return { toasts, showToast, removeToast };
}