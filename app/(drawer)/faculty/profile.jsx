import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { useProfile } from '../../../context/UserContext';

export default function FacultyProfile() {
  const { profile, updateProfile } = useProfile();

  const [saving, setSaving] = useState(false);
  
  // Basic Info Form States
  const [subjectsStr, setSubjectsStr] = useState('');
  const [phone, setPhone] = useState('');
  const [cubicle, setCubicle] = useState('');
  const [acceptsMessages, setAcceptsMessages] = useState(false);

  // Office Hours Builder State
  const [officeHours, setOfficeHours] = useState([]);
  const [newDay, setNewDay] = useState('');
  const [newFromTime, setNewFromTime] = useState('');
  const [newToTime, setNewToTime] = useState('');

  useEffect(() => {
    if (profile) {
      setSubjectsStr(Array.isArray(profile.subjects) ? profile.subjects.join(', ') : '');
      setPhone(profile.phone || '');
      setCubicle(profile.cubicle || '');
      setAcceptsMessages(profile.acceptsMessages || false);
      setOfficeHours(profile.officeHours || []);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const parsedSubjects = subjectsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
      
      await updateProfile({
        subjects: parsedSubjects,
        phone: phone.trim() || null,
        cubicle: cubicle.trim(),
        acceptsMessages,
        officeHours: officeHours
      });
      alert('Profile details saved successfully!');
    } catch (e) {
      alert('Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSlot = () => {
    if (!newDay || !newFromTime || !newToTime) {
      alert("Please fill all time slot fields.");
      return;
    }
    const slotString = `${newDay} ${newFromTime} - ${newToTime}`.trim();
    setOfficeHours(prev => [...prev, slotString]);
    setNewDay('');
    setNewFromTime('');
    setNewToTime('');
  };

  const handleRemoveSlot = (index) => {
    setOfficeHours(prev => prev.filter((_, i) => i !== index));
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
        
        {/* Core Metadata */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Basic Profile Settings</Text>
          
          <Text style={styles.label}>Subjects Taught (comma separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Data Structures, React Native"
            value={subjectsStr}
            onChangeText={setSubjectsStr}
          />

          <Text style={styles.label}>Phone Number (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 9876543210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Cubicle Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. M-101A"
            value={cubicle}
            onChangeText={setCubicle}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Allow direct student messages</Text>
            <Switch
              value={acceptsMessages}
              onValueChange={setAcceptsMessages}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={acceptsMessages ? '#1E90FF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Office Hours Manager */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Office Hours</Text>
          
          {officeHours.length > 0 ? (
            officeHours.map((slot, idx) => (
              <View key={idx} style={styles.slotRow}>
                <Text style={styles.slotText}>• {slot}</Text>
                <TouchableOpacity onPress={() => handleRemoveSlot(idx)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>[X]</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No office hours registered.</Text>
          )}

          <View style={styles.addSlotContainer}>
            <TextInput
              style={[styles.input, styles.compactInput]}
              placeholder="Day (e.g. Mon)"
              value={newDay}
              onChangeText={setNewDay}
            />
            <TextInput
              style={[styles.input, styles.compactInput]}
              placeholder="From (e.g. 10:00 AM)"
              value={newFromTime}
              onChangeText={setNewFromTime}
            />
            <TextInput
              style={[styles.input, styles.compactInput]}
              placeholder="To (e.g. 12:00 PM)"
              value={newToTime}
              onChangeText={setNewToTime}
            />
            <TouchableOpacity style={styles.addSlotBtn} onPress={handleAddSlot}>
              <Text style={styles.addSlotBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.mainSaveBtn} onPress={handleSaveProfile} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainSaveBtnText}>Save All Changes</Text>}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 15,
    color: '#444',
    fontWeight: '500',
    flex: 1,
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  slotText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  addSlotContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  compactInput: {
    marginBottom: 8,
    paddingVertical: 8,
  },
  addSlotBtn: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addSlotBtnText: {
    color: '#1565C0',
    fontWeight: 'bold',
  },
  mainSaveBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainSaveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
