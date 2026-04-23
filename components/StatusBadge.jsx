import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

const STATUS_COLORS = {
  available: '#4CAF50',
  busy: '#F44336',
  in_class: '#FFC107',
  not_on_campus: '#9E9E9E',
  unknown: '#9E9E9E',
};

const STATUS_LABELS = {
  available: 'Available',
  busy: 'Busy',
  in_class: 'In Class',
  not_on_campus: 'Not on Campus',
  unknown: 'Unknown',
};

export default function StatusBadge({ status }) {
  const normalizedStatus = status || 'unknown';
  
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [prevColor, setPrevColor] = useState(STATUS_COLORS[normalizedStatus]);
  const [currColor, setCurrColor] = useState(STATUS_COLORS[normalizedStatus]);

  useEffect(() => {
    const newColor = STATUS_COLORS[normalizedStatus] || STATUS_COLORS.unknown;
    
    if (newColor !== currColor) {
      setPrevColor(currColor);
      setCurrColor(newColor);
      
      colorAnim.setValue(0);
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false, // Color interpolation requires JS thread
      }).start();
    }
  }, [normalizedStatus]);

  const animatedBackgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [prevColor, currColor]
  });

  return (
    <Animated.View style={[styles.badge, { backgroundColor: animatedBackgroundColor }]}>
      <Text style={styles.text}>{STATUS_LABELS[normalizedStatus] || STATUS_LABELS.unknown}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  text: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  }
});
