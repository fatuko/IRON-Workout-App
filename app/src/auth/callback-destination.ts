export function callbackDestination(type: string | null, redirectType: unknown, onboarded: boolean) {
  if (type === 'recovery' || redirectType === 'recovery') return '/reset-password';
  return onboarded ? '/' : '/onboarding';
}
