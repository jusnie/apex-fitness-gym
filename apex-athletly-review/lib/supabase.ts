import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TAG = 'Supabase';

// Environment variables (set in .env)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`❌ [${TAG}] Missing environment variables:`, {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
  });
} else {
  console.log(`✅ [${TAG}] Config loaded — URL: ${supabaseUrl}`);
}

// Secure storage adapter for Supabase Auth (with logging)
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const shortKey = key.length > 30 ? key.slice(0, 30) + '...' : key;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          const value = window.localStorage.getItem(key);
          console.log(`🔍 [${TAG}:Storage] getItem(${shortKey}) → ${value ? 'found' : 'null'} (web)`);
          return value;
        }
        return null;
      }
      const value = await SecureStore.getItemAsync(key);
      console.log(`🔍 [${TAG}:Storage] getItem(${shortKey}) → ${value ? `found (${value.length} chars)` : 'null'}`);
      return value;
    } catch (err) {
      console.error(`❌ [${TAG}:Storage] getItem(${shortKey}) error:`, err);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const shortKey = key.length > 30 ? key.slice(0, 30) + '...' : key;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
      console.log(`💾 [${TAG}:Storage] setItem(${shortKey}) → saved (${value.length} chars)`);
    } catch (err) {
      console.error(`❌ [${TAG}:Storage] setItem(${shortKey}) error:`, err);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    const shortKey = key.length > 30 ? key.slice(0, 30) + '...' : key;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
      console.log(`🗑️ [${TAG}:Storage] removeItem(${shortKey}) → deleted`);
    } catch (err) {
      console.error(`❌ [${TAG}:Storage] removeItem(${shortKey}) error:`, err);
    }
  },
};

console.log(`🔧 [${TAG}] Creating Supabase client...`);

// Create Supabase client with secure storage
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Important for React Native
    },
  }
);

console.log(`✅ [${TAG}] Client created`);
