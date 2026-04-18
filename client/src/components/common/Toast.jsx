import { useState, useEffect } from 'react';

let toastFn = null;

export const toast = {
  success: (msg) => toastFn?.('success', msg),
  error: (msg) => toastFn?.('error', msg),
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastFn = (type, message) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };
    return () => { toastFn = null; };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
            t.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
