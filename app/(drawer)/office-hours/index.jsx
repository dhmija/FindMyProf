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
    
    // Role based condition dynamically listening natively
    const fieldConstraint = role === 'student' ? 'studentId' : 'facultyId';
    
    const q = query(
      bookingsRef, 
      where(fieldConstraint, '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveBookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(liveBookings);
      setLoading(false);
    }, (error) => {
      console.error(error);
      // Fallback query without orderBy if index is missing from fresh Firestore setup
      const fallbackQ = query(bookingsRef, where(fieldConstraint, '==', user.uid));
      onSnapshot(fallbackQ, (fallbackSnap) => {
          const fbBookings = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          fbBookings.sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
          setBookings(fbBookings);
          setLoading(false);
      });
    });

    return () => unsubscribe();
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
      case 'confirmed': return '#4CAF50'; // Green
      case 'cancelled': return '#F44336'; // Red
      case 'pending': return '#FF9800'; // Orange
      default: return '#9E9E9E';
    }
  };

  const renderBooking = ({ item }) => {
    const isStudent = role === 'student';
    
    return (
      <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.personName}>{isStudent ? item.facultyName : item.studentName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
             <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
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
              {actingOn === item.id ? <ActivityIndicator size="small" color="#fff"/> : <Text style={styles.btnText}>Confirm</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity 
               style={[styles.btn, styles.cancelBtn]}
               disabled={actingOn === item.id}
               onPress={() => handleUpdateStatus(item.id, 'cancelled')}
            >
              <Text style={styles.btnText}>Cancel</Text>
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
               {actingOn === item.id ? <ActivityIndicator size="small" color="#fff"/> : <Text style={styles.btnText}>Withdraw Request</Text>}
             </TouchableOpacity>
           </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E90FF" />
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
    backgroundColor: '#FAFAFA',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
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
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
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
    backgroundColor: '#4CAF50',
  },
  cancelBtn: {
    backgroundColor: '#F44336',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  }
});
