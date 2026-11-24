import 'expo-sqlite/localStorage/install';

export const storage = {
  getItem: (key: string): string | null => localStorage.getItem(key),
  setItem: (key: string, value: string) => localStorage.setItem(key, value),
  removeItem: (key: string) => localStorage.removeItem(key),
};
