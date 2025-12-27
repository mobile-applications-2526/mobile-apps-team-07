import React, { createContext, useContext, useState, PropsWithChildren } from 'react';

type AuthContextType = {
    signIn: () => void;
    signOut: () => void;
    session: string | null;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    signIn: () => null,
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
    const [session, setSession] = useState<string | null>(() => {
        return process.env.EXPO_PUBLIC_DISABLE_AUTHENTICATION === 'true' ? 'dev-session' : null;
    });
    const [isLoading, setIsLoading] = useState(false);

    return (
        <AuthContext.Provider
            value={{
                signIn: () => {
                    setIsLoading(true);
                    // Simulate network request
                    setTimeout(() => {
                        setSession('dummy-session-token');
                        setIsLoading(false);
                    }, 1000);
                },
                signOut: () => {
                    setSession(null);
                },
                session,
                isLoading,
            }}>
            {children}
        </AuthContext.Provider>
    );
}
