import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { firestore } from '../../../services/firebase';
import StatusBadge from '../../../components/StatusBadge';
import AuthGateSheet from '../../../components/AuthGateSheet';
import { useAuth } from '../../../context/AuthContext';
import { sendQuickNotify } from '../../../services/chatService';
import { requestBooking } from '../../../services/bookingService';
import { useProfile } from '../../../context/UserContext';
import { useTheme } from '../../../context/ThemeContext';

export default function DirectoryDetail() {
  const { id } = useLocalSearchParams();
  const { user, role } = useAuth();
  const { profile } = useProfile();
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(null); 

  // Auth Gate State
  const [authGateVisible, setAuthGateVisible] = useState(false);
  const [authGateMessage, setAuthGateMessage] = useState("");

  const handleAuthGate = (message, action) => {
    if (!user) {
       setAuthGateMessage(message);
       setAuthGateVisible(true);
    } else {
       action();
    }
  };

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    const docRef = doc(firestore, 'faculties', id);
    
    const unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
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

    // Only listen to bookings if the user is authenticated — rules block unauthenticated reads
    let unsubscribeBookings = () => {};
    if (user) {
      const bookingsRef = collection(firestore, 'bookings');
      const q = query(bookingsRef, where('facultyId', '==', id), where('status', 'in', ['pending', 'confirmed']));
      unsubscribeBookings = onSnapshot(q, (snapshot) => {
        const activeBookings = snapshot.docs.map(d => d.data().slot);
        setBookedSlots(activeBookings);
      });
    }

    return () => {
      unsubscribeProfile();
      unsubscribeBookings();
    };
  }, [id, user]);

  useEffect(() => {
    navigation.setOptions({ 
      title: '', 
      headerBackTitleVisible: false,
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16, padding: 4 }}>
          <Feather name="chevron-left" size={24} color="#111" />
        </TouchableOpacity>
      )
    });
  }, [navigation, router]);

  const handleEmail = () => {
    if (faculty?.email) {
      Linking.openURL(`mailto:${faculty.email}`);
    }
  };

  const handleQuickNotify = async () => {
    if (role !== 'student') {
        alert("Only students can notify faculty members.");
        return;
    }
    setNotifyLoading(true);
    try {
      if (user?.uid && faculty?.id) {
         let studentName = profile?.fullName || profile?.name || 'Student';
         await sendQuickNotify(faculty.id, user.uid, faculty.name, studentName);
         alert("Teacher notified!");
      }
    } catch(e) {
      alert("Failed to send notification.");
    } finally {
      setNotifyLoading(false);
    }
  };
  
  const handleBookSlot = async (slotString) => {
    if (role !== 'student') {
        alert("Only students can book office hours.");
        return;
    }
    
    setBookingLoading(slotString);
    try {
        let studentName = profile?.fullName || profile?.name || 'Unknown Student';
        await requestBooking(faculty.id, faculty.name, user.uid, studentName, slotString);
        alert("Booking requested! Faculty will confirm shortly.");
    } catch(e) {
        alert("Failed to book slot.");
    } finally {
        setBookingLoading(null);
    }
  };

  const navigateToChat = () => {
    const chatId = `${faculty.id}_${user.uid}`;
    router.push({
      pathname: `/messages/${chatId}`,
      params: { 
        facultyId: faculty.id, 
        studentId: user.uid, 
        displayName: faculty.name 
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
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

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}>
        
        {/* Header Block */}
        <View style={styles.headerBlock}>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{faculty.name}</Text>
            <Text style={styles.department}>{faculty.department}</Text>
          </View>
          {faculty.isRegistered && (
            <StatusBadge status={faculty.status} />
          )}
        </View>

        {/* Action Row */}
        {!faculty.isRegistered ? (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.unregisteredBanner}>
               <Text style={styles.unregisteredText}>Faculty hasn't joined FindMyProf yet</Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={handleEmail}>
               <Text style={styles.primaryButtonText}>Send an Email</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.actionRow}>
            {faculty.acceptsMessages && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.msgButton]} 
                onPress={() => handleAuthGate("Login required to send a direct message.", navigateToChat)}
              >
                <Text style={[styles.actionButtonText, { color: '#fafaf8' }]}>Send Message</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.actionButton, styles.notifyButton]} 
              onPress={() => handleAuthGate("Login required to notify the faculty that you're heading over.", handleQuickNotify)}
              disabled={notifyLoading}
            >
              {notifyLoading ? <ActivityIndicator color="#1a1a1a" size="small"/> : <Text style={[styles.actionButtonText, { color: '#1a1a1a' }]}>I'm heading to your office</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Notices */}
        {faculty.isRegistered && (faculty.statusText || faculty.substitutionNotice) ? (
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeText}>⚠️ Status: {faculty.statusText || faculty.substitutionNotice}</Text>
          </View>
        ) : null}

        {/* Info Rows (Flat format) */}
        <View style={styles.flatInfoContainer}>
           <View style={styles.infoRow}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>
              {(faculty.location?.block || faculty.block) === 'M'
                ? `M Block · Floor ${faculty.location?.floor || faculty.floor || '1'} · Cubicle ${faculty.location?.cubicle || faculty.cubicle || 'N/A'}`
                : `${faculty.location?.block || faculty.block || 'Unknown'} Block · Cubicle ${faculty.location?.cubicle || faculty.cubicle || 'N/A'}`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{faculty.email}</Text>
          </View>
          {faculty.phoneVisible && faculty.phone ? (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{faculty.phone}</Text>
            </View>
          ) : null}
        </View>

        {/* Registered Additions */}
        {faculty.isRegistered && (
          <>
            {/* Office Hours */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Office Hours Bookings</Text>
              {faculty.officeHours && faculty.officeHours.length > 0 ? (
                faculty.officeHours.map((slotData, index) => {
                  const slotStr = typeof slotData === 'string' ? slotData : `${slotData.day} · ${slotData.from} - ${slotData.to}`;
                  const isBooked = bookedSlots.includes(slotStr);
                  const isLoading = bookingLoading === slotStr;
                  
                  return (
                    <View key={index} style={styles.slotRow}>
                      <Text style={[styles.slotText, isBooked && styles.slotTextMuted]}>• {slotStr}</Text>
                      {isBooked ? (
                        <View style={styles.bookedBadge}>
                           <Text style={styles.bookedText}>Unavailable</Text>
                        </View>
                      ) : (
                        ((!user || role === 'student') && (
                          <TouchableOpacity 
                            style={styles.bookButton} 
                            disabled={isLoading} 
                            onPress={() => handleAuthGate("Login required to secure an office hours slot.", () => handleBookSlot(slotStr))}
                          >
                            {isLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.bookText}>Book Slot</Text>}
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  );
                })
              ) : (
                <Text style={styles.mutedText}>No office hours posted.</Text>
              )}
            </View>


          </>
        )}
      </ScrollView>

      {/* Embedded Dynamic AuthGate */}
      <AuthGateSheet 
         visible={authGateVisible} 
         onClose={() => setAuthGateVisible(false)} 
         actionMessage={authGateMessage}
         returnTo={`/directory/${id}`}
      />
    </>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
    paddingRight: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 28,
  },
  department: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  flatInfoContainer: {
    marginBottom: 16,
  },
  // Section card
  card: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textVeryMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  // Unregistered state
  unregisteredBanner: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    width: 80,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  value: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  // Buttons
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'column',
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontWeight: '700',
    fontSize: 14,
  },
  msgButton: {
    backgroundColor: colors.primary,
  },
  notifyButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  // Notices
  noticeBanner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  noticeText: {
    color: colors.textSubtle,
    fontSize: 13,
  },
  // Office hours slots
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  slotText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
    paddingRight: 10,
  },
  slotTextMuted: {
    color: colors.placeholder,
    textDecorationLine: 'line-through',
  },
  bookButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  bookText: {
    color: colors.primaryText,
    fontWeight: '600',
    fontSize: 12,
  },
  bookedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookedText: {
    fontSize: 11,
    color: colors.placeholder,
    fontWeight: '600',
  },
  // Subjects
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  pillText: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
  },
  mutedText: {
    color: colors.placeholder,
    fontSize: 13,
    fontStyle: 'italic',
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});

