import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { firestore } from '../../../services/firebase';
import { useAuth } from '../../../context/AuthContext';
import { updateBookingStatus } from '../../../services/bookingService';

export default function OfficeHoursBookingIndex() {
  const { user, role } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null); // tracking ID of booking being parsed

  useEffect(() => {
    if (!user?.uid || !role) return;

    const bookingsRef = collection(firestore, 'bookings');
    
    const fieldConstraint = role === 'student' ? 'studentId' : 'facultyId';
    
    const q = query(
      bookingsRef, 
      where(fieldConstraint, '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    let fallbackUnsubscribe = null;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveBookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(liveBookings);
      setLoading(false);
    }, (error) => {
      // After logout, Firebase fires permission-denied — bail out silently.
      if (error.code === 'permission-denied') {
        setLoading(false);
        return;
      }
      console.error(error);
      const fallbackQ = query(bookingsRef, where(fieldConstraint, '==', user.uid));
      fallbackUnsubscribe = onSnapshot(fallbackQ, (fallbackSnap) => {
          const fbBookings = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          fbBookings.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
          setBookings(fbBookings);
          setLoading(false);
      }, (fbError) => {
          if (fbError.code !== 'permission-denied') console.error(fbError);
      });
    });

    return () => {
      unsubscribe();
      if (fallbackUnsubscribe) {
         fallbackUnsubscribe();
      }
    };
  }, [user, role]);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setActingOn(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus);
    } catch(e) {
      alert("Failed to update status.");
    } finally {
      setActingOn(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return { bg: '#1a1a1a', text: '#fafaf8' };
      case 'cancelled': return { bg: '#f0f0f0', text: '#555555' };
      case 'pending':   return { bg: '#fafaf8', text: '#888888', border: '#d0d0d0' };
      default:          return { bg: '#f0f0f0', text: '#888888' };
    }
  };

  const renderBooking = ({ item }) => {
    const isStudent = role === 'student';
    
    return (
      <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.personName}>{isStudent ? item.facultyName : item.studentName}</Text>
          <View style={[styles.statusBadge, { 
            backgroundColor: getStatusColor(item.status).bg,
            borderColor: getStatusColor(item.status).border || getStatusColor(item.status).bg,
          }]}>
             <Text style={[styles.statusText, { color: getStatusColor(item.status).text }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.slotDetails}>{item.slot}</Text>

        {/* Action Controls for Faculty */}
        {!isStudent && item.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
               style={[styles.btn, styles.confirmBtn]}
               disabled={actingOn === item.id}
               onPress={() => handleUpdateStatus(item.id, 'confirmed')}
            >
              {actingOn === item.id ? <ActivityIndicator size="small" color="#fafaf8"/> : <Text style={styles.confirmBtnText}>Confirm</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity 
               style={[styles.btn, styles.cancelBtn]}
               disabled={actingOn === item.id}
               onPress={() => handleUpdateStatus(item.id, 'cancelled')}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Revocation Controls for Students if pending */}
        {isStudent && item.status === 'pending' && (
           <View style={styles.actionRow}>
             <TouchableOpacity 
                style={[styles.btn, styles.cancelBtn]}
                disabled={actingOn === item.id}
                onPress={() => handleUpdateStatus(item.id, 'cancelled')}
             >
               {actingOn === item.id ? <ActivityIndicator size="small" color="#555555"/> : <Text style={styles.cancelBtnText}>Withdraw Request</Text>}
             </TouchableOpacity>
           </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderBooking}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
             <Text style={styles.emptyText}>You don't have any bookings yet.</Text>
          </View>
        }
      />
    </View>
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
    padding: 24,
  },
  listContent: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#fafaf8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1a1a1a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  personName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  slotDetails: {
    fontSize: 14,
    color: '#555',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    backgroundColor: '#1a1a1a',
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0',
  },
  confirmBtnText: {
    color: '#fafaf8',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cancelBtnText: {
    color: '#555555',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  }
});
