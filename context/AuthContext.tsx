import { getToken, saveToken, deleteToken } from '@/services/storage';
import { login, LoginCredentials } from '@/services/auth';
import React, { createContext, useContext, useState, PropsWithChildren, useEffect } from 'react';

type AuthContextType = {
    signIn: (credentials: LoginCredentials) => Promise<void>;
    signOut: () => void;
    session: string | null;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    signIn: async () => { },
    signOut: () => null,
    session: null,
    isLoading: false,
});

export function useSession() {
    const value = useContext(AuthContext);
    if (process.env.NODE_ENV !== 'production') {
        if (!value) {
            throw new Error('useSession must be wrapped in a <AuthProvider />');
        }
    }

    return value;
}

export function AuthProvider({ children }: PropsWithChildren) {
    const [session, setSession] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load persisted token on mount
        const loadToken = async () => {
            if (process.env.EXPO_PUBLIC_DISABLE_AUTHENTICATION === 'true') {
                setSession('dev-session');
                setIsLoading(false);
                return;
            }

            try {
                const token = await getToken();
                if (token) {
                    setSession(token);
                }
            } catch (error) {
                console.error('Failed to load token:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadToken();
    }, []);

    const handleSignIn = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            const response = await login(credentials);
            if (response.token) {
                await saveToken(response.token);
                setSession(response.token);
            }
        } catch (error) {
            console.error('Sign in failed:', error);
            throw error; // Propagate error for UI handling
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await deleteToken();
            setSession(null);
        } catch (error) {
            console.error('Sign out failed:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                signIn: handleSignIn,
                signOut: handleSignOut,
                session,
                isLoading,
            }}>
            {children}
        </AuthContext.Provider>
    );
}
