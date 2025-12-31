import React, { useState } from 'react';
import { View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useSession } from '@/context/AuthContext';
import { ThemedText, ThemedView, Loader } from '@/components/common';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { ArrowLeft } from 'lucide-react-native';

export default function SignIn() {
    const router = useRouter();
    const { signIn, session, isLoading } = useSession();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    if (!isLoading && session) {
        return <Redirect href="/(tabs)" />;
    }

    const handleSignIn = async () => {
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setError(null);
        try {
            await signIn({ email, password });
        } catch (err: any) {
            setError(err.message || 'Failed to sign in. Please check your credentials.');
        }
    };

    if (isLoading) {
        return <Loader text="Signing in..." />;
    }

    return (
        <ThemedView testID="sign-in-screen" className="flex-1 bg-white dark:bg-black p-4">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                    <TouchableOpacity
                        testID="sign-in-back-button"
                        onPress={() => router.back()}
                        className="absolute top-12 left-0 z-10 w-8 h-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
                    >
                        <ArrowLeft size={20} color="#666" />
                    </TouchableOpacity>

                    <View className="items-center mb-10">
                        <ThemedText type="title" className="text-2xl font-bold mb-1">Welcome Back</ThemedText>
                    </View>

                    {error && (
                        <View testID="error-message" className="mb-4 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                            <ThemedText className="text-red-500 text-center text-sm">{error}</ThemedText>
                        </View>
                    )}

                    <View className="space-y-6 gap-4">
                        <AuthInput
                            testID="email-input"
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <AuthInput
                            testID="password-input"
                            label="Password"
                            placeholder="Enter your password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <View className="pt-2">
                            <AuthButton
                                testID="sign-in-button"
                                title="Sign In"
                                onPress={handleSignIn}
                            />
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    );
}
