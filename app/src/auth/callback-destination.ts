export function callbackDestination(type: string | null, redirectType: unknown) {
  if (type === 'recovery' || redirectType === 'recovery') return '/reset-password';
  return '/';
}
