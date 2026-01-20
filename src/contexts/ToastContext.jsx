import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now();
    const newToast = {
      id,
      duration: 5000,
      ...toast
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Helper pour badge débloqué
  const showBadgeUnlocked = useCallback((badge) => {
    addToast({
      type: 'badge',
      badge,
      duration: 6000
    });
  }, [addToast]);

  // Helper pour XP gagné
  const showXPGained = useCallback((amount, action) => {
    addToast({
      type: 'xp',
      amount,
      action,
      duration: 3000
    });
  }, [addToast]);

  // Helper pour level up
  const showLevelUp = useCallback((newLevel) => {
    addToast({
      type: 'levelup',
      level: newLevel,
      duration: 6000
    });
  }, [addToast]);

  // Helper générique
  const showSuccess = useCallback((message) => {
    addToast({
      type: 'success',
      message,
      duration: 4000
    });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      showBadgeUnlocked,
      showXPGained,
      showLevelUp,
      showSuccess
    }}>
      {children}
    </ToastContext.Provider>
  );
};
