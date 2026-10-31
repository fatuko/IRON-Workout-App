import 'react-native-url-polyfill/auto';
import { createClient, processLock } from '@supabase/supabase-js';
import { storage } from './storage';
import { getPreview, previewAuth } from '@/auth/preview';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && key ? createClient(url, key, {
  auth: { storage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, lock: processLock },
}) : null;

export function authClient() {
  if (__DEV__ && getPreview().enabled) return previewAuth;
  if (!supabase) throw new Error('Account services are not configured yet. Please try again later.');
  return supabase.auth;
}
