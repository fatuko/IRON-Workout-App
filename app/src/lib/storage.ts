// Web storage is accessed lazily so static rendering never touches window.
export const storage = {
  getItem: (key: string): string | null => typeof window === 'undefined' ? null : window.localStorage.getItem(key),
  setItem: (key: string, value: string) => { if (typeof window !== 'undefined') window.localStorage.setItem(key, value); },
  removeItem: (key: string) => { if (typeof window !== 'undefined') window.localStorage.removeItem(key); },
};
