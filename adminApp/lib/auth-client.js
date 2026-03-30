import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createAuthClient } from 'better-auth/react';

const DEFAULT_AUTH_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8787',
  ios: 'http://localhost:8787',
  default: 'http://localhost:8787',
});

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_BETTER_AUTH_URL || DEFAULT_AUTH_BASE_URL,
  disableDefaultFetchPlugins: true,
  plugins: [
    expoClient({
      scheme: 'adminapp',
      storagePrefix: 'adminapp',
      storage: SecureStore,
    }),
  ],
});
