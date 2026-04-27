import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { firestore } from '../../../services/firebase';
import StatusBadge from '../../../components/StatusBadge';
import AuthGateSheet from '../../../components/AuthGateSheet';
import { useAuth } from '../../../context/AuthContext';
import { sendQuickNotify } from '../../../services/chatService';
import { requestBooking } from '../../../services/bookingService';
import { useProfile } from '../../../context/UserContext';

export default function DirectoryDetail() {
  const { id } = useLocalSearchParams();
  const { user, role } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  
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

  const initials = faculty.name ? faculty.name.split(' ').map(n => n[0]).join('').substring(0, 2) : '?';

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        {/* Header & Avatar Block */}
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

        {/* Action Row */}
        {!faculty.isRegistered ? (
          <View style={styles.card}>
            <View style={styles.unregisteredBanner}>
              <Text style={styles.unregisteredText}>Faculty hasn't joined FindMyProf yet</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Location:</Text>
              <Text style={styles.value}>
                {faculty.block === 'M'
                  ? `M Block · Floor ${faculty.floor} · Cubicle ${faculty.cubicle}`
                  : `${faculty.block} Block · Cubicle ${faculty.cubicle}`}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.primaryButton} onPress={handleEmail}>
              <Text style={styles.primaryButtonText}>Send an Email</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.actionRow}>
              {faculty.acceptsMessages && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.msgButton]} 
                  onPress={() => handleAuthGate("Login required to send a direct message.", navigateToChat)}
                >
                  <Text style={styles.actionButtonText}>Send Message</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.actionButton, styles.notifyButton]} 
                onPress={() => handleAuthGate("Login required to notify the faculty that you're heading over.", handleQuickNotify)}
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
                <Text style={styles.value}>
                  {faculty.block === 'M'
                    ? `M Block · Floor ${faculty.floor} · Cubicle ${faculty.cubicle}`
                    : `${faculty.block} Block · Cubicle ${faculty.cubicle}`}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{faculty.email}</Text>
              </View>
            </View>

            {/* Office Hours */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Office Hours Bookings</Text>
              {faculty.officeHours && faculty.officeHours.length > 0 ? (
                faculty.officeHours.map((slot, index) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isLoading = bookingLoading === slot;
                  
                  return (
                    <View key={index} style={styles.slotRow}>
                      <Text style={[styles.slotText, isBooked && styles.slotTextMuted]}>• {slot}</Text>
                      {isBooked ? (
                        <View style={styles.bookedBadge}>
                           <Text style={styles.bookedText}>Unavailable</Text>
                        </View>
                      ) : (
                        // Render standard book button for everyone, hit auth gate if unauthenticated implicitly via internal hook natively
                        // Only hide completely if they are authenticated AND a faculty explicitly preventing loopbacks natively
                        ((!user || role === 'student') && (
                          <TouchableOpacity 
                            style={styles.bookButton} 
                            disabled={isLoading} 
                            onPress={() => handleAuthGate("Login required to secure an office hours slot.", () => handleBookSlot(slot))}
                          >
                            {isLoading ? <ActivityIndicator color="#1E90FF" size="small" /> : <Text style={styles.bookText}>Book Slot</Text>}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerBlock: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#555',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
    marginBottom: 4,
  },
  department: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  badgeWrapper: {
    marginTop: 12,
  },
  // Section card
  card: {
    borderWidth: 1,
    borderColor: '#ebebeb',
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#aaa',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  // Unregistered state
  unregisteredBanner: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 12,
  },
  unregisteredText: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
  },
  // Info rows
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  value: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  // Buttons
  primaryButton: {
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 6,
    alignItems: 'center',
  },
  msgButton: {
    backgroundColor: '#111',
  },
  notifyButton: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  // Notice
  noticeBanner: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  noticeText: {
    color: '#666',
    fontSize: 13,
  },
  // Office hours slots
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  slotText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    paddingRight: 10,
  },
  slotTextMuted: {
    color: '#ccc',
    textDecorationLine: 'line-through',
  },
  bookButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#111',
    borderRadius: 4,
  },
  bookText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  bookedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  bookedText: {
    fontSize: 11,
    color: '#ccc',
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
    borderColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  pillText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '500',
  },
  mutedText: {
    color: '#ccc',
    fontSize: 13,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#999',
    fontSize: 14,
  },
});

