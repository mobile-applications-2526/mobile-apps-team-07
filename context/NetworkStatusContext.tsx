import React, { createContext, useCallback, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/useToast';
import { WifiOff } from 'lucide-react-native';

interface NetworkStatusContextType {
    isOffline: boolean;
    setIsOffline: (offline: boolean) => void;
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

    const setIsOffline = useCallback((offline: boolean) => {
        setIsOfflineState(offline);
    }, []);

    // Watch for network status changes and trigger toast
    useEffect(() => {
        const prev = prevOfflineRef.current;

        if (isOffline && !prev) {
            // Going offline
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
    }, [isOffline, showToast]);

    return (
        <NetworkStatusContext.Provider value={{ isOffline, setIsOffline }}>
            {children}
        </NetworkStatusContext.Provider>
    );
}
