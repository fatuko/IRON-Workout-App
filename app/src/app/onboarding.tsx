import { Redirect } from 'expo-router';

// Keep old links working without an onboarding flow.
export default function OnboardingRedirect() {
  return <Redirect href="/" />;
}
