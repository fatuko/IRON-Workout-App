import * as Linking from 'expo-linking';
export const emailRedirect = () => Linking.createURL('auth-callback');
