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

  useEffect(() => {
    if (loading || splashVisible || hasSeenOnboarding === null) return;

    const inAuthGroup = segments[0] === 'auth';
    const isSpecialRoute = segments[0] === 'onboarding';

    if (!user) {
      if (!inAuthGroup && !isSpecialRoute) {
        if (hasSeenOnboarding === 'true') {
          router.replace('/auth/login');
        } else {
          router.replace('/onboarding');
        }
      }
    } else if (user) {
      if (inAuthGroup || isSpecialRoute || segments.length === 0) {
        if (role === 'faculty') {
          router.replace('/faculty/home');
        } else if (role === 'student') {
          router.replace('/student/home');
        }
      }
    }
  }, [user, role, loading, splashVisible, segments, hasSeenOnboarding]);

  if (loading || splashVisible) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.splashTitle}>FindMyProf</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <StatusBar style="auto" />
      <Slot />
    </SafeAreaView>
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
    backgroundColor: '#1E90FF',
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  }
});
