import { Redirect } from 'expo-router';

// Catches /--/ (Expo Go internal launch path) and any other unmatched routes.
// Always redirect to the faculty directory as the landing page.
export default function NotFound() {
  return <Redirect href="/(tabs)/directory" />;
}
