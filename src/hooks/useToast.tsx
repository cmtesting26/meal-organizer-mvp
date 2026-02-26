/**
 * useToast Hook
 * Simple toast notification system
 * 
 * Usage:
 * const { toast } = useToast();
 * toast.success('Recipe saved!');
 * toast.error('Failed to save');
 */

import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast_${toastCount++}`;
    const toast: Toast = { id, type, message };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (message: string) => addToast('success', message),
    error: (message: string) => addToast('error', message),
    info: (message: string) => addToast('info', message),
  };

  return {
    toasts,
    toast,
    removeToast
  };
}

/**
 * ToastContainer Component
 * Displays toast notifications
 */

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2" aria-live="polite">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: ''
  };

  const infoStyle = toast.type === 'info' ? {
    backgroundColor: 'var(--fs-accent-light, #FEF0E8)',
    borderColor: 'var(--fs-accent-muted, #E8C4B8)',
    color: 'var(--fs-accent-text, #B84835)',
  } : undefined;

  const Icon = icons[toast.type];

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right ${colors[toast.type]}`}
      style={infoStyle}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 font-medium">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
