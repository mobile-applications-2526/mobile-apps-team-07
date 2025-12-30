import React, { createContext, useCallback, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/useToast';
import { WifiOff, Wifi } from 'lucide-react-native';

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
    const prevOfflineRef = useRef<boolean | null>(null);
    const hasShownInitialRef = useRef(false);

    const setIsOffline = useCallback((offline: boolean) => {
        setIsOfflineState(offline);
    }, []);

    const resetNetworkToast = useCallback(() => {
        // Force show current status on manual refresh
        // Only show offline toast if offline, don't show "online" on successful refresh
        if (isOffline) {
            showToast('Offline', <WifiOff size={16} color="#fff" />);
        }
        // Reset prev so next change can trigger toast
        prevOfflineRef.current = isOffline;
    }, [isOffline, showToast]);

    // Watch for offline state changes (set by contexts based on API failures)
    useEffect(() => {
        const prev = prevOfflineRef.current;

        // Skip first render to avoid toast on app load
        if (!hasShownInitialRef.current) {
            hasShownInitialRef.current = true;
            prevOfflineRef.current = isOffline;
            return;
        }

        // Only show toast if status actually changed
        if (prev !== null && prev !== isOffline) {
            if (isOffline) {
                showToast('Offline', <WifiOff size={16} color="#fff" />);
            } else {
                showToast('Online', <Wifi size={16} color="#fff" />);
            }
        }

        prevOfflineRef.current = isOffline;
    }, [isOffline, showToast]);

    return (
        <NetworkStatusContext.Provider value={{ isOffline, setIsOffline, resetNetworkToast }}>
            {children}
        </NetworkStatusContext.Provider>
    );
}
