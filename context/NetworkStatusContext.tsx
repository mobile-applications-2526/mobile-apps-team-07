import React, { createContext, useCallback, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/useToast';
import { WifiOff } from 'lucide-react-native';

interface NetworkStatusContextType {
    isOffline: boolean;
    setIsOffline: (offline: boolean) => void;
    resetNetworkToast: () => void;
}

const NetworkStatusContext = createContext<NetworkStatusContextType | null>(null);

export function useNetworkStatus() {
    const context = useContext(NetworkStatusContext);
    if (!context) {
        throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
    }
    return context;
}

interface NetworkStatusProviderProps {
    children: ReactNode;
}

export function NetworkStatusProvider({ children }: NetworkStatusProviderProps) {
    const [isOffline, setIsOfflineState] = useState(false);
    const { showToast } = useToast();
    const hasShownOfflineToast = useRef(false);
    const prevOfflineRef = useRef<boolean>(false);

    const [toastResetTrigger, setToastResetTrigger] = useState(0);

    const setIsOffline = useCallback((offline: boolean) => {
        setIsOfflineState(offline);
    }, []);

    const resetNetworkToast = useCallback(() => {
        hasShownOfflineToast.current = false;
        setToastResetTrigger(prev => prev + 1);
    }, []);

    // Watch for network status changes and trigger toast
    useEffect(() => {
        const prev = prevOfflineRef.current;

        if (isOffline) {
            // Going offline or forced check while offline (via reset)
            if (!hasShownOfflineToast.current) {
                showToast('Offline', <WifiOff size={16} color="#fff" />);
                hasShownOfflineToast.current = true;
            }
        } else if (!isOffline && prev) {
            // Going online
            showToast('Online');
            hasShownOfflineToast.current = false;
        }

        prevOfflineRef.current = isOffline;
    }, [isOffline, showToast, toastResetTrigger]);

    return (
        <NetworkStatusContext.Provider value={{ isOffline, setIsOffline, resetNetworkToast }}>
            {children}
        </NetworkStatusContext.Provider>
    );
}
