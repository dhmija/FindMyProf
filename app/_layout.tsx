import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { UserProvider } from "../context/UserContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

function RootNavigation() {
  const { user, role, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [splashVisible, setSplashVisible] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);

  useEffect(() => {
    import('expo-secure-store').then(SecureStore => {
      SecureStore.getItemAsync('hasSeenOnboarding')
        .then(val => setHasSeenOnboarding(val || 'false'))
        .catch(() => setHasSeenOnboarding('false'));
    });
    
    const timer = setTimeout(() => {
      setSplashVisible(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Segment-based navigation guard
  useEffect(() => {
    if (!loading) {
      const inTabsGroup = segments[0] === '(tabs)';
      const isProtectedRoute = inTabsGroup && ['messages', 'office-hours', 'profile'].includes(segments[1]);
      
      if (!user && isProtectedRoute) {
        router.replace('/(tabs)/directory');
      }
    }
  }, [user, loading, segments]);

  if (loading || splashVisible) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.splashTitle}>FindMyProf</Text>
        <Text style={styles.splashSubtitle}>faculty directory</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fafaf8' }}>
      <StatusBar style="auto" />
      <Slot />
    </View>
  );
}

export default function Layout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserProvider>
          <RootNavigation />
        </UserProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafaf8',
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 6,
    letterSpacing: 0.2,
  },
});
