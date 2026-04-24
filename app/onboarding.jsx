import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleComplete = async () => {
    await SecureStore.setItemAsync('hasSeenOnboarding', 'true');
    router.replace('/directory/index');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to FindMyProf</Text>
        <Text style={styles.subtitle}>Let's get started on optimizing your campus operations.</Text>
        
        <View style={styles.card}>
           <Text style={styles.roleHeader}>🎓 For Students:</Text>
           <Text style={styles.roleDesc}>Search faculty mapping directly across block networks. Check live office hours, observe their class availability actively flashing, or throw out a book slot asynchronously!</Text>
        </View>

        <View style={styles.card}>
           <Text style={styles.roleHeader}>👔 For Faculty:</Text>
           <Text style={styles.roleDesc}>Claim your seeded block securely. Handle booking requests dynamically over a live dashboard, broadcast leave notices instantly, and lock your availability seamlessly.</Text>
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity style={styles.continueBtn} onPress={handleComplete}>
           <Text style={styles.continueBtnText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  roleHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  roleDesc: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  spacer: {
    flex: 1,
  },
  continueBtn: {
    backgroundColor: '#1E90FF',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
