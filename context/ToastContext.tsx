import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { OverlayToast } from '@/components/common/OverlayToast';

interface ToastContextType {
    showToast: (message: string, icon?: ReactNode) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider. Wrap your app in <ToastProvider>.');
    }
    return context;
}

interface ToastProviderProps {
    children: ReactNode;
}

interface ToastState {
    message: string;
    icon?: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
    const [toastState, setToastState] = useState<ToastState | null>(null);

    const showToast = useCallback((message: string, icon?: ReactNode) => {
        setToastState(null); // Reset first to allow re-triggering same message if needed
        // Small timeout to ensure state update if message is same
        setTimeout(() => {
            setToastState({ message, icon });
        }, 0);
    }, []);

    const handleAnimationComplete = useCallback(() => {
        setToastState(null);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toastState && (
                <OverlayToast
                    key={Date.now()} // Force re-mount to ensure animation plays every time
                    message={toastState.message}
                    icon={toastState.icon}
                    onAnimationComplete={handleAnimationComplete}
                />
            )}
        </ToastContext.Provider>
    );
}
