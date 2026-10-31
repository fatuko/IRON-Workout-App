import { useEffect, useRef, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '@/auth/provider';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { AccountPage, Action, Notice } from '@/components/account-ui';
import { authClient } from '@/lib/supabase';
import { callbackDestination } from '@/auth/callback-destination';

export default function AuthCallback() {
  const router = useRouter(), link = Linking.useURL();
  const { session } = useAuth();
  const [destination, setDestination] = useState<'/' | '/onboarding' | '/reset-password' | null>(null);
  const handled = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const url = Platform.OS === 'web' ? window.location.href : link;
    if (!url || handled.current === url) return;
    handled.current = url;
    async function complete() {
      try {
        const parsed = new URL(url!);
        const values = new URLSearchParams(parsed.hash.slice(1));
        parsed.searchParams.forEach((value, key) => values.set(key, value));
        // Remove credentials from browser history even if the exchange fails.
        if (Platform.OS === 'web') window.history.replaceState(null, '', '/auth-callback');
        if (values.has('error') || values.has('error_code')) throw new Error('This link is invalid or has expired. Please request a new email.');
        const access_token = values.get('access_token'), refresh_token = values.get('refresh_token');
        const code = values.get('code');
        const auth = authClient();
        const result = code ? await auth.exchangeCodeForSession(code) : access_token && refresh_token
          ? await auth.setSession({ access_token, refresh_token }) : null;
        if (!result) throw new Error('No confirmation was found in this link. Please open the latest email link.');
        if (result.error) throw new Error('This link is invalid or has expired. Please request a new email.');
        const destination = callbackDestination(values.get('type'),
          'redirectType' in result.data ? result.data.redirectType : null,
          result.data.user?.user_metadata.onboarding_complete === true);
        setDestination(destination);
      } catch (e) { setError(e instanceof Error ? e.message : 'Could not verify this link.'); }
    }
    void complete();
  }, [link, router]);
  if (destination && session) return <Redirect href={destination} />;
  return <AccountPage title={error ? 'Let’s try that again.' : 'Verifying your link.'} subtitle={error ? 'Request a fresh email and open its link.' : 'Your account will be ready in a moment.'}>
    <Notice error text={error} />
    {error && <><Action title="Request a password reset" onPress={() => router.replace('/forgot-password')} /><Action title="Continue" secondary onPress={() => router.replace('/')} /></>}
  </AccountPage>;
}
