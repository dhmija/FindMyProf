import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_LABELS = {
  available: 'Available',
  busy: 'Busy',
  in_class: 'In Class',
  not_on_campus: 'Not on Campus',
  unknown: 'Unknown',
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'available':
      return { bg: '#111', text: '#fff', border: '#111' };
    case 'busy':
      return { bg: '#fff', text: '#111', border: '#111' };
    case 'in_class':
    case 'not_on_campus':
      return { bg: '#f0f0f0', text: '#555', border: '#f0f0f0' };
    case 'unknown':
    default:
      return { bg: '#e5e5e5', text: '#888', border: '#e5e5e5' };
  }
};

export default function StatusBadge({ status }) {
  const normalizedStatus = status || 'unknown';
  const theme = getStatusStyle(normalizedStatus);

  return (
    <View style={[styles.badge, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <Text style={[styles.text, { color: theme.text }]}>
        {STATUS_LABELS[normalizedStatus] || STATUS_LABELS.unknown}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    fontSize: 12,
  }
});
