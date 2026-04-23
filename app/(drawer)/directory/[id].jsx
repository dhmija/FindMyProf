import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../../services/firebase';
import StatusBadge from '../../../components/StatusBadge';
import { useAuth } from '../../../context/AuthContext';
import { sendQuickNotify } from '../../../services/chatService';

export default function DirectoryDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifyLoading, setNotifyLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    const docRef = doc(firestore, 'faculties', id);
    
    // Set up real-time listener for live status updates
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setFaculty({ id: docSnap.id, ...docSnap.data() });
      } else {
        setFaculty(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error receiving snapshot:", error);
      setLoading(false);
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, [id]);

  const handleEmail = () => {
    if (faculty?.email) {
      Linking.openURL(`mailto:${faculty.email}`);
    }
  };

  const handleQuickNotify = async () => {
    setNotifyLoading(true);
    try {
      if (user?.uid && faculty?.id) {
         await sendQuickNotify(faculty.id, user.uid);
         alert("Teacher notified!");
      }
    } catch(e) {
      alert("Failed to send notification.");
    } finally {
      setNotifyLoading(false);
    }
  };

  const navigateToChat = () => {
    // Navigating without query params per standard structure (assuming global state tracking or router params implementation later)
    router.push(`/messages/index`); 
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text style={styles.mutedText}>Locating faculty profile...</Text>
      </View>
    );
  }

  if (!faculty) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Faculty not found.</Text>
      </View>
    );
  }

  // Determine Initials Fallback
  const initials = faculty.name ? faculty.name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      
      {/* 1. Header & Avatar Block */}
      <View style={styles.headerBlock}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{faculty.name}</Text>
        <Text style={styles.department}>{faculty.department}</Text>
        
        {faculty.isRegistered && (
          <View style={styles.badgeWrapper}>
            <StatusBadge status={faculty.status} />
          </View>
        )}
      </View>

      {/* 2. Unregistered View vs Registered View */}
      {!faculty.isRegistered ? (
        <View style={styles.card}>
          <View style={styles.unregisteredBanner}>
            <Text style={styles.unregisteredText}>Faculty hasn't joined FindMyProf yet</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>Block {faculty.block} • Floor {faculty.floor} • Cubicle {faculty.cubicle}</Text>
          </View>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleEmail}>
            <Text style={styles.primaryButtonText}>Send an Email</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Registered Interactive Banner */}
          <View style={styles.actionRow}>
            {faculty.acceptsMessages && (
              <TouchableOpacity style={[styles.actionButton, styles.msgButton]} onPress={navigateToChat}>
                <Text style={styles.actionButtonText}>Send Message</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.actionButton, styles.notifyButton]} 
              onPress={handleQuickNotify}
              disabled={notifyLoading}
            >
              {notifyLoading ? <ActivityIndicator color="#fff" size="small"/> : <Text style={styles.actionButtonText}>I'm heading to your office</Text>}
            </TouchableOpacity>
          </View>

          {faculty.substitutionNotice ? (
            <View style={styles.noticeBanner}>
              <Text style={styles.noticeText}>⚠️ Notice: {faculty.substitutionNotice}</Text>
            </View>
          ) : null}

          {/* Details Card */}
          <View style={styles.card}>
             <View style={styles.infoRow}>
              <Text style={styles.label}>Location:</Text>
              <Text style={styles.value}>Block {faculty.block} • Floor {faculty.floor} • Cubicle {faculty.cubicle}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{faculty.email}</Text>
            </View>
          </View>

          {/* Office Hours */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Office Hours</Text>
            {faculty.officeHours && faculty.officeHours.length > 0 ? (
              faculty.officeHours.map((slot, index) => (
                <View key={index} style={styles.slotRow}>
                   <Text style={styles.slotText}>• {slot}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.mutedText}>No office hours posted.</Text>
            )}
          </View>

          {/* Subjects List */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Subjects Taught</Text>
            {faculty.subjects && faculty.subjects.length > 0 ? (
               <View style={styles.pillContainer}>
                 {faculty.subjects.map((sub, idx) => (
                   <View key={idx} style={styles.pill}>
                     <Text style={styles.pillText}>{sub}</Text>
                   </View>
                 ))}
               </View>
            ) : (
              <Text style={styles.mutedText}>No subjects listed.</Text>
            )}
          </View>
        </>
      )}

    </ScrollView>
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
    backgroundColor: '#FAFAFA',
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#757575',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  department: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  badgeWrapper: {
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  unregisteredBanner: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  unregisteredText: {
    color: '#757575',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#1E90FF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  msgButton: {
    backgroundColor: '#1E90FF',
  },
  notifyButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  noticeBanner: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFCC80',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  noticeText: {
    color: '#E65100',
    fontWeight: '600',
  },
  slotRow: {
    marginBottom: 6,
  },
  slotText: {
    fontSize: 14,
    color: '#444',
  },
  mutedText: {
    color: '#999',
    fontStyle: 'italic',
  },
  errorText: {
    color: '#D8000C',
    fontSize: 16,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillText: {
    color: '#1565C0',
    fontSize: 12,
    fontWeight: '600',
  }
});
