import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useProfile } from '../../../context/UserContext';

const STATUSES = [
  { id: 'available', label: 'Available', color: '#4CAF50' },
  { id: 'busy', label: 'Busy', color: '#F44336' },
  { id: 'in_class', label: 'In Class', color: '#FFC107' },
  { id: 'not_on_campus', label: 'Not on Campus', color: '#9E9E9E' }
];

export default function FacultyHome() {
  const { profile, updateProfile } = useProfile();
  
  const [notice, setNotice] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingNotice, setIsUpdatingNotice] = useState(false);
  
  const confirmAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (profile?.substitutionNotice) {
      setNotice(profile.substitutionNotice);
    }
  }, [profile?.substitutionNotice]);

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

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{profile.name}</Text>
        </View>

        {/* Quick Availability Toggle */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Status</Text>
          
          <View style={styles.statusGrid}>
            {STATUSES.map((statusItem) => {
              const isActive = profile.status === statusItem.id;
              return (
                <TouchableOpacity 
                  key={statusItem.id}
                  style={[
                    styles.statusBtn, 
                    isActive && { backgroundColor: statusItem.color, borderColor: statusItem.color }
                  ]}
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
            ✓ Status updated globally
          </Animated.Text>
        </View>

        {/* Substitution Notice */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Substitution / Absence Notice</Text>
          <Text style={styles.cardSubtitle}>Broadcast a temporary notice to students viewing your profile.</Text>
          
          <TextInput
            style={styles.inputArea}
            multiline
            numberOfLines={3}
            placeholder="e.g. Taking leave for 3 days. My classes are substituted by Prof. Raman."
            value={notice}
            onChangeText={setNotice}
          />
          
          <View style={styles.actionRow}>
            {profile.substitutionNotice ? (
              <TouchableOpacity style={[styles.btn, styles.clearBtn]} onPress={handleClearNotice} disabled={isUpdatingNotice}>
                <Text style={styles.clearBtnText}>Clear Notice</Text>
              </TouchableOpacity>
            ) : <View style={{ flex: 1 }} />}
            
            <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSetNotice} disabled={isUpdatingNotice || notice.trim() === ''}>
              {isUpdatingNotice ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Publish Notice</Text>}
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
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
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  statusBtnText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 14,
  },
  statusBtnTextActive: {
    color: '#fff',
  },
  successText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  inputArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: '#1E90FF',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearBtn: {
    backgroundColor: '#FFF1F0',
    borderWidth: 1,
    borderColor: '#FFCACA',
  },
  clearBtnText: {
    color: '#D8000C',
    fontWeight: 'bold',
  }
});
