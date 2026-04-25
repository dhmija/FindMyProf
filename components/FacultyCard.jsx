import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';

const FacultyCard = React.memo(({ faculty }) => {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Destructure typical faculty objects (from seed schema)
  const { id, name, department, block, floor, cubicle, isRegistered, status } = faculty;

  useEffect(() => {
    if (isRegistered && status === 'available') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ])
      ).start();
    }
  }, [isRegistered, status, pulseAnim]);

  const handlePress = () => {
    router.push(`/directory/${id}`);
  };

  const getStatusColor = () => {
    switch(status) {
      case 'available': return '#4CAF50';
      case 'busy': return '#F44336';
      case 'on_leave': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        
        {isRegistered ? (
          <View style={styles.badgeContainer}>
            <Animated.View style={[styles.pulseDot, { backgroundColor: getStatusColor(), opacity: status === 'available' ? pulseAnim : 1 }]} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {status ? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ') : 'Unknown'}
            </Text>
          </View>
        ) : (
          <View style={styles.unregisteredBadge}>
            <Text style={styles.unregisteredText}>Not on FindMyProf yet</Text>
          </View>
        )}
      </View>

      <Text style={styles.department}>{department}</Text>
      
      <View style={styles.locationRow}>
        <Text style={styles.locationText}>
          {block === 'M'
            ? `M Block · Floor ${floor} · Cubicle ${cubicle}`
            : `${block} Block · Cubicle ${cubicle}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    paddingRight: 8,
  },
  department: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  locationRow: {
    backgroundColor: '#F5F5F5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  unregisteredBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unregisteredText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  }
});

export default FacultyCard;
