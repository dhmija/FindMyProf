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

    const isProtectedStudent = segments[0] === '(drawer)' && segments[1] === 'student';
    const isProtectedFaculty = segments[0] === '(drawer)' && segments[1] === 'faculty';
    const isProtectedMessages = segments[0] === '(drawer)' && segments[1] === 'messages';
    const isProtectedOffice = segments[0] === '(drawer)' && segments[1] === 'office-hours';
    const isProtected = isProtectedStudent || isProtectedFaculty || isProtectedMessages || isProtectedOffice;

    if (!user && isProtected) {
      router.replace('/auth/login');
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
