import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const STATUS_LABELS = {
  available: 'Available',
  busy: 'Busy',
  in_class: 'In Class',
  not_on_campus: 'Not on Campus',
  unknown: 'Unknown',
};

export default function StatusBadge({ status }) {
  const { colors } = useTheme();
  const normalizedStatus = status || 'unknown';

  const getStatusStyle = () => {
    switch (normalizedStatus) {
      case 'available':
        return { bg: colors.primary, text: colors.primaryText, border: colors.primary };
      case 'busy':
        return { bg: colors.surface, text: colors.text, border: colors.text };
      case 'in_class':
      case 'not_on_campus':
        return { bg: colors.fill, text: colors.textSubtle, border: colors.fill };
      case 'unknown':
      default:
        return { bg: colors.fill, text: colors.textMuted, border: colors.fill };
    }
  };

  const theme = getStatusStyle();

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
