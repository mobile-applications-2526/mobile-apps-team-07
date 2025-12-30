// constants/env.ts

export const IS_EXPO_GO = process.env.EXPO_PUBLIC_IS_EXPO_GO === 'true'; // __DEV__ usage is deprecated for this purpose, using env var instead.

// You might also want to check for other build environments if necessary,
// but for the purpose of avoiding native module issues in Expo Go, this env var is sufficient.
