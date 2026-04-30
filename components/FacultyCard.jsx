import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

const FacultyCard = React.memo(({ faculty }) => {
  const router = useRouter();
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { id, name, department, isRegistered, status } = faculty;

  // Location: seeded faculty store flat fields; self-registered faculty store nested location object
  const block   = faculty.block   ?? faculty.location?.block;
  const floor   = faculty.floor   ?? faculty.location?.floor;
  const cubicle = faculty.cubicle ?? faculty.location?.cubicle;

  // Build location string — only render if at least block is defined
  const locationStr = block
    ? (block === 'M' && floor)
      ? `M Block · Floor ${floor}${cubicle ? ` · Cubicle ${cubicle}` : ''}`
      : `${block} Block${cubicle ? ` · Cubicle ${cubicle}` : ''}`
    : null;

  // Status badge: show for any registered faculty with a meaningful status
  const statusLabel = !isRegistered
    ? null
    : status === 'available' ? 'Available'
    : status === 'busy'     ? 'Busy'
    : status === 'in_class' ? 'In Class'
    : status === 'on_leave' ? 'On Leave'
    : null;

  const isAvailable = isRegistered && status === 'available';

  useEffect(() => {
    if (isAvailable) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,   duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isAvailable, pulseAnim]);

  const handlePress = () => router.push(`/directory/${id}`);

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.6}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>

        {isRegistered && statusLabel ? (
          <View style={[styles.badge, isAvailable ? styles.badgeFilled : styles.badgeOutline]}>
            {isAvailable && <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />}
            <Text style={[styles.badgeText, isAvailable ? styles.badgeTextFilled : styles.badgeTextOutline]}>
              {statusLabel}
            </Text>
          </View>
        ) : !isRegistered ? (
          <Text style={styles.unregisteredLabel}>Not registered</Text>
        ) : null}
      </View>

      <Text style={styles.department} numberOfLines={1}>{department}</Text>
      {locationStr ? (
        <Text style={styles.location}>{locationStr}</Text>
      ) : null}
    </TouchableOpacity>
  );
});

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    paddingRight: 8,
  },
  department: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 5,
  },
  location: {
    fontSize: 12,
    color: colors.textVeryMuted,
    letterSpacing: 0.1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeFilled: {
    backgroundColor: colors.primary,
  },
  badgeOutline: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primaryText,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextFilled: {
    color: colors.primaryText,
  },
  badgeTextOutline: {
    color: colors.textMuted,
  },
  unregisteredLabel: {
    fontSize: 11,
    color: colors.textVeryMuted,
  },
});

export default FacultyCard;
