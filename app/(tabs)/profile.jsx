import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/UserContext';
import { useRouter } from 'expo-router';

// Only status options relevant to monochrome pass
const STATUSES = [
  { id: 'available', label: 'Available' },
  { id: 'busy', label: 'Busy' },
  { id: 'in_class', label: 'In Class' },
  { id: 'not_on_campus', label: 'Not on Campus' }
];

export default function ProfileTab() {
  const { user, role, logout } = useAuth();
  const { profile, updateProfile, refreshProfile } = useProfile();
  const router = useRouter();

  const [fetchTimeout, setFetchTimeout] = useState(false);

  // Faculty State
  const [notice, setNotice] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingNotice, setIsUpdatingNotice] = useState(false);
  const confirmAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (profile?.substitutionNotice) {
      setNotice(profile.substitutionNotice);
    }
  }, [profile?.substitutionNotice]);

  useEffect(() => {
    if (user && !profile) {
      const timer = setTimeout(() => {
        setFetchTimeout(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else if (profile) {
      setFetchTimeout(false);
    }
  }, [user, profile]);

  const showConfirmation = () => {
    confirmAnim.setValue(1);
    Animated.timing(confirmAnim, {
      toValue: 0,
      duration: 2000,
      useNativeDriver: true,
      delay: 500,
    }).start();
  };

  const handleStatusUpdate = async (newStatus) => {
    if (profile?.status === newStatus || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await updateProfile({ status: newStatus });
      showConfirmation();
    } catch (e) {
      alert("Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSetNotice = async () => {
    setIsUpdatingNotice(true);
    try {
      await updateProfile({ substitutionNotice: notice.trim() || null });
      alert("Notice updated successfully!");
    } catch (e) {
      alert("Failed to update notice.");
    } finally {
      setIsUpdatingNotice(false);
    }
  };

  const handleClearNotice = async () => {
    setIsUpdatingNotice(true);
    try {
      setNotice('');
      await updateProfile({ substitutionNotice: null });
    } catch (e) {
      alert("Failed to clear notice.");
    } finally {
      setIsUpdatingNotice(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  // --- GUEST VIEW ---
  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.guestCard}>
          <Text style={styles.appLogo}>FindMyProf</Text>
          <Text style={styles.guestMessage}>Sign in to access your profile.</Text>
          
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/auth/login')}>
            <Text style={styles.primaryBtnText}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.outlineBtn} onPress={() => router.push('/auth/student-signup')}>
            <Text style={styles.outlineBtnText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!profile) {
    if (fetchTimeout) {
      return (
        <View style={styles.centerContainer}>
          <Text style={{ marginBottom: 16, color: '#888' }}>Taking longer than usual to load profile...</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={refreshProfile}>
            <Text style={styles.primaryBtnText}>Retry Loading Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.outlineBtn, { marginTop: 12 }]} onPress={handleLogout}>
            <Text style={styles.outlineBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#111" />
      </View>
    );
  }

  // --- STUDENT VIEW ---
  if (role === 'student') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Student Dashboard</Text>
          <Text style={styles.name}>{profile.fullName || profile.name}</Text>
          <Text style={styles.meta}>{profile.department} | Sem {profile.semester}</Text>
        </View>
        
        <View style={styles.card}>
           <Text style={styles.cardTitle}>ACCOUNT OPTIONS</Text>
           <TouchableOpacity style={[styles.primaryBtn, {marginTop: 10}]} onPress={handleLogout}>
              <Text style={styles.primaryBtnText}>Logout</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // --- FACULTY VIEW ---
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.greeting}>Faculty Dashboard</Text>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.meta}>{profile.department}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>CURRENT STATUS</Text>
          
          <View style={styles.statusGrid}>
            {STATUSES.map((statusItem) => {
              const isActive = profile.status === statusItem.id;
              return (
                <TouchableOpacity 
                  key={statusItem.id}
                  style={[styles.statusBtn, isActive && styles.statusBtnActive]}
                  onPress={() => handleStatusUpdate(statusItem.id)}
                  disabled={isUpdatingStatus}
                >
                  <Text style={[styles.statusBtnText, isActive && styles.statusBtnTextActive]}>
                    {statusItem.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <Animated.Text style={[styles.successText, { opacity: confirmAnim }]}>
            ✓ Status updated
          </Animated.Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>SUBSTITUTION NOTICE</Text>
          <Text style={styles.cardSubtitle}>Broadcast a temporary notice to students viewing your profile.</Text>
          
          <TextInput
            style={styles.inputArea}
            multiline
            numberOfLines={3}
            placeholder="e.g. Taking leave for 3 days."
            value={notice}
            onChangeText={setNotice}
          />
          
          <View style={styles.actionRow}>
            {profile.substitutionNotice ? (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearNotice} disabled={isUpdatingNotice}>
                <Text style={styles.clearBtnText}>Clear Notice</Text>
              </TouchableOpacity>
            ) : <View style={{ flex: 1 }} />}
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSetNotice} disabled={isUpdatingNotice || notice.trim() === ''}>
              {isUpdatingNotice ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Publish Notice</Text>}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={[styles.primaryBtn, {marginTop: 10}]} onPress={handleLogout}>
              <Text style={styles.primaryBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  guestCard: {
    width: '100%',
    alignItems: 'center',
  },
  appLogo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  guestMessage: {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: '#111',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  outlineBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
  },
  outlineBtnText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
    marginTop: 12,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '600',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
  },
  meta: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ebebeb',
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#aaa',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  statusBtn: {
    flexBasis: '48%',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 6,
    alignItems: 'center',
  },
  statusBtnActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  statusBtnText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 13,
  },
  statusBtnTextActive: {
    color: '#fff',
  },
  successText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  inputArea: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
    color: '#333',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  saveBtn: {
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  clearBtn: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
  }
});
