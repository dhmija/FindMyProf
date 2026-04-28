import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/UserContext';
import { useRouter } from 'expo-router';

const STATUSES = [
  { id: 'available', label: 'Available' },
  { id: 'in_class', label: 'In Class' },
  { id: 'on_leave', label: 'On Leave' },
  { id: 'busy', label: 'Busy' }
];

export default function ProfileTab() {
  const { user, role, logout } = useAuth();
  const { profile, updateProfile, refreshProfile } = useProfile();
  const router = useRouter();

  const [fetchTimeout, setFetchTimeout] = useState(false);

  // Faculty State
  const [statusText, setStatusText] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneVisible, setPhoneVisible] = useState(false);
  
  const [locBlock, setLocBlock] = useState('');
  const [locFloor, setLocFloor] = useState('');
  const [locCubicle, setLocCubicle] = useState('');
  
  const [officeHours, setOfficeHours] = useState([]);
  const [newOhDay, setNewOhDay] = useState('');
  const [newOhFrom, setNewOhFrom] = useState('');
  const [newOhTo, setNewOhTo] = useState('');

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingText, setIsUpdatingText] = useState(false);
  const [isUpdatingMessages, setIsUpdatingMessages] = useState(false);
  const confirmAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (profile) {
      if (profile.statusText !== undefined) setStatusText(profile.statusText);
      if (profile.substitutionNotice !== undefined && profile.statusText === undefined) setStatusText(profile.substitutionNotice);
      if (profile.phone !== undefined) setPhone(profile.phone);
      if (profile.phoneVisible !== undefined) setPhoneVisible(profile.phoneVisible);
      if (profile.location) {
        setLocBlock(profile.location.block || '');
        setLocFloor(profile.location.floor?.toString() || '');
        setLocCubicle(profile.location.cubicle || '');
      }
      if (profile.officeHours) setOfficeHours(profile.officeHours);
    }
  }, [profile]);

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
    const targetStatus = profile?.status === newStatus ? null : newStatus;
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await updateProfile({ status: targetStatus });
      showConfirmation();
    } catch (e) {
      alert("Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handlePhoneSave = async () => {
    try {
      await updateProfile({ phone, phoneVisible });
      showConfirmation();
    } catch (e) {
      alert("Failed to save phone tracking.");
    }
  };

  const handleLocationSave = async () => {
    try {
      await updateProfile({ location: { block: locBlock, floor: locFloor, cubicle: locCubicle } });
      showConfirmation();
    } catch (e) {
      alert("Failed to save location.");
    }
  };

  const handleTextSave = async (explicitText) => {
    const textToSave = explicitText !== undefined ? explicitText : statusText;
    setIsUpdatingText(true);
    try {
      await updateProfile({ statusText: textToSave.trim() || null });
      if (explicitText !== undefined) setStatusText(explicitText);
      showConfirmation();
    } catch (e) {
      alert("Failed to update notice.");
    } finally {
      setIsUpdatingText(false);
    }
  };

  const handleAddOfficeHour = async () => {
    if (!newOhDay.trim() || !newOhFrom.trim() || !newOhTo.trim()) return;
    try {
      const newSlot = { day: newOhDay, from: newOhFrom, to: newOhTo };
      const updatedArray = [...officeHours, newSlot];
      await updateProfile({ officeHours: updatedArray });
      setOfficeHours(updatedArray);
      setNewOhDay(''); setNewOhFrom(''); setNewOhTo('');
      showConfirmation();
    } catch (e) {
      alert("Failed to add office hour.");
    }
  };

  const handleDeleteOfficeHour = async (idxToDel) => {
    try {
      const updatedArray = officeHours.filter((_, idx) => idx !== idxToDel);
      await updateProfile({ officeHours: updatedArray });
      setOfficeHours(updatedArray);
      showConfirmation();
    } catch (e) {
      alert("Failed to remove slot.");
    }
  };

  const handleToggleMessages = async () => {
    setIsUpdatingMessages(true);
    try {
      await updateProfile({ acceptsMessages: !profile.acceptsMessages });
    } catch (e) {
      alert("Failed to update message settings.");
    } finally {
      setIsUpdatingMessages(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)/directory');
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
        <ActivityIndicator size="large" color="#1a1a1a" />
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
          <Text style={styles.staticEmail}>{user.email}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>PHONE NUMBER</Text>
          <View style={styles.inputRow}>
            <TextInput 
              style={[styles.inputField, {flex: 1}]}
              placeholder="e.g. 555-0199"
              keyboardType="number-pad"
              value={phone}
              onChangeText={setPhone}
            />
            {(phone !== (profile.phone || '') || phoneVisible !== !!profile.phoneVisible) && (
              <TouchableOpacity style={styles.inlineActionBtn} onPress={handlePhoneSave}>
                <Text style={styles.inlineActionText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Show phone on profile</Text>
            <Switch 
              value={phoneVisible} 
              onValueChange={setPhoneVisible}
              trackColor={{ false: '#e5e5e5', true: '#1a1a1a' }}
              thumbColor={'#fafaf8'}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>OFFICE LOCATION</Text>
          <Text style={styles.cardSubtitle}>Block Select</Text>
          <View style={styles.gridRow}>
            {['M', 'N1', 'N2'].map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.segmentBtn, locBlock === b && styles.segmentBtnActive]}
                onPress={() => setLocBlock(b)}
              >
                <Text style={[styles.segmentBtnText, locBlock === b && styles.segmentBtnTextActive]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {locBlock === 'M' && (
            <>
              <Text style={styles.cardSubtitle}>Floor Select</Text>
              <View style={styles.gridRow}>
                {['1', '2', '3'].map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.segmentBtn, locFloor === f && styles.segmentBtnActive]}
                    onPress={() => setLocFloor(f)}
                  >
                    <Text style={[styles.segmentBtnText, locFloor === f && styles.segmentBtnTextActive]}>Floor {f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.cardSubtitle}>Cubicle/Room Number</Text>
          <TextInput 
            style={styles.inputField}
            placeholder="e.g. C-45"
            value={locCubicle}
            onChangeText={setLocCubicle}
          />

          {(locBlock !== (profile.location?.block || '') || locFloor !== (profile.location?.floor || '') || locCubicle !== (profile.location?.cubicle || '')) && (
            <TouchableOpacity style={[styles.primaryBtn, {marginTop: 12}]} onPress={handleLocationSave}>
              <Text style={styles.primaryBtnText}>Save Location</Text>
            </TouchableOpacity>
          )}
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
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>OFFICE HOURS</Text>
          {officeHours.map((oh, idx) => (
            <View key={idx} style={styles.ohCard}>
               <View>
                 <Text style={styles.ohDay}>{oh.day}</Text>
                 <Text style={styles.ohTime}>{oh.from} - {oh.to}</Text>
               </View>
               <TouchableOpacity onPress={() => handleDeleteOfficeHour(idx)}>
                  <Text style={styles.delText}>Delete</Text>
               </TouchableOpacity>
            </View>
          ))}
          <View style={styles.ohInputRow}>
            <TextInput style={[styles.inputField, {flex: 2, marginRight: 8}]} placeholder="Day (e.g. Mon)" value={newOhDay} onChangeText={setNewOhDay} />
            <TextInput style={[styles.inputField, {flex: 1.5, marginRight: 8}]} placeholder="From" value={newOhFrom} onChangeText={setNewOhFrom} />
            <TextInput style={[styles.inputField, {flex: 1.5}]} placeholder="To" value={newOhTo} onChangeText={setNewOhTo} />
          </View>
          <TouchableOpacity style={[styles.outlineBtn, {marginTop: 12}]} onPress={handleAddOfficeHour}>
             <Text style={styles.outlineBtnText}>+ Add Slot</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>MESSAGE SETTINGS</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1a1a1a' }}>Accept Direct Messages</Text>
            <Switch 
              value={profile.acceptsMessages} 
              onValueChange={handleToggleMessages}
              disabled={isUpdatingMessages}
              trackColor={{ false: '#e5e5e5', true: '#1a1a1a' }}
              thumbColor={'#fafaf8'}
            />
          </View>
          <Text style={styles.cardSubtitle}>
            When disabled, students can notify you they are heading to your office but cannot chat.
          </Text>
        </View>

        <Animated.Text style={[styles.floatingSuccess, { opacity: confirmAnim }]}>
           Saved successfully
        </Animated.Text>

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
    backgroundColor: '#fafaf8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafaf8',
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
    color: '#1a1a1a',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  guestMessage: {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  },
  primaryBtn: {
    backgroundColor: '#1a1a1a',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#fafaf8',
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
    color: '#1a1a1a',
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
    color: '#1a1a1a',
  },
  meta: {
    fontSize: 14,
    color: '#555555',
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
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  statusBtnText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 13,
  },
  statusBtnTextActive: {
    color: '#fafaf8',
  },
  staticEmail: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputField: {
    backgroundColor: '#fafaf8',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1a1a1a',
  },
  inlineActionBtn: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
  },
  inlineActionText: {
    color: '#fafaf8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fafaf8',
  },
  segmentBtnActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  segmentBtnText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 13,
  },
  segmentBtnTextActive: {
    color: '#fafaf8',
  },
  chipBtn: {
    backgroundColor: '#fafaf8',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '500',
  },
  ohCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafaf8',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  ohDay: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    fontSize: 14,
  },
  ohTime: {
    color: '#555555',
    fontSize: 13,
    marginTop: 2,
  },
  delText: {
    color: '#888888',
    fontWeight: 'bold',
    fontSize: 12,
  },
  ohInputRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  floatingSuccess: {
    textAlign: 'center',
    color: '#1a1a1a',
    fontWeight: 'bold',
    marginVertical: 16,
  }
});
