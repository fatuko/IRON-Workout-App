export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : 'Enter a valid email address.';
}

export function validatePassword(password: string, confirmation: string) {
  if (password.length < 8) return 'Use at least 8 characters for your password.';
  if (password !== confirmation) return 'Your passwords do not match.';
  return null;
}

export function validateName(first: string, last: string) {
  if (!first.trim() || !last.trim()) return 'Enter your first and last name.';
  if (first.trim().length > 80 || last.trim().length > 80) return 'Each name must be 80 characters or fewer.';
  return null;
}

export function readName(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }
