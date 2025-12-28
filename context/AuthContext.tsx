import { getToken, saveToken, deleteToken, saveUser, getUser, deleteUser } from '@/services/storage';
import { login, LoginCredentials } from '@/services/auth';
import React, { createContext, useContext, useState, PropsWithChildren, useEffect } from 'react';

// Basic Base64 decode for JWT
const atob = (input: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = input.replace(/=+$/, '');
    let output = '';

    if (str.length % 4 == 1) {
        throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (let bc = 0, bs = 0, buffer, i = 0;
        buffer = str.charAt(i++);
        ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
            bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
        buffer = chars.indexOf(buffer);
    }
    return output;
}

type AuthContextType = {
    signIn: (credentials: LoginCredentials) => Promise<void>;
    signOut: () => void;
    session: string | null;
    user: { email: string } | null;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    signIn: async () => { },
    signOut: () => null,
    session: null,
    user: null,
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
    const [user, setUser] = useState<{ email: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load persisted token and user on mount
        const loadToState = async () => {
            if (process.env.EXPO_PUBLIC_DISABLE_AUTHENTICATION === 'true') {
                setSession('dev-session');
                setUser({ email: 'dev@example.com' });
                setIsLoading(false);
                return;
            }

            try {
                const token = await getToken();
                if (token) {
                    setSession(token);
                    const savedUser = await getUser();

                    if (savedUser) {
                        setUser(savedUser);
                    } else {
                        // Try to decode token for email if no saved user
                        try {
                            // Simple JWT decode for payload
                            const parts = token.split('.');
                            if (parts.length === 3) {
                                const payload = JSON.parse(atob(parts[1]));
                                if (payload.sub) {
                                    const derivedUser = { email: payload.sub };
                                    setUser(derivedUser);
                                    saveUser(derivedUser); // Save for next time
                                }
                            }
                        } catch (e) {
                            console.warn('Failed to decode token for email:', e);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load auth state:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadToState();
    }, []);

    const handleSignIn = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            const response = await login(credentials);
            console.log('Login response:', JSON.stringify(response, null, 2));

            if (response.token) {
                await saveToken(response.token);
                setSession(response.token);

                if (response.user) {
                    await saveUser(response.user);
                    setUser(response.user);
                } else {
                    console.warn('Login response missing user object, decoding token');
                    try {
                        const parts = response.token.split('.');
                        if (parts.length === 3) {
                            const payload = JSON.parse(atob(parts[1]));
                            if (payload.sub) {
                                const derivedUser = { email: payload.sub };
                                setUser(derivedUser);
                                await saveUser(derivedUser);
                            }
                        }
                    } catch (e) {
                        console.warn('Failed to decode token on login:', e);
                    }
                }
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
            await deleteUser();
            setSession(null);
            setUser(null);
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
                user,
                isLoading,
            }}>
            {children}
        </AuthContext.Provider>
    );
}
