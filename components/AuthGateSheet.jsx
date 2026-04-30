import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

export default function AuthGateSheet({ visible, onClose, actionMessage, returnTo }) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // We track local visibility to allow out-animation before unmounting fully
  const [internalVisible, setInternalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        })
      ]).start(() => setInternalVisible(false));
    }
  }, [visible, slideAnim, fadeAnim]);

  // Use internal visibility so the component renders during the out-transition
  if (!internalVisible) return null;

  const handleNavigate = (path) => {
    onClose();
    setTimeout(() => {
      router.push({ pathname: path, params: { returnTo } });
    }, 150);
  };

  return (
    <Modal transparent visible={internalVisible} animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>
      
      <Animated.View style={[styles.sheetContainer, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handleBar} />

        <View style={styles.header}>
          <Text style={styles.title}>Login Required</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.message}>{actionMessage || "Authentication is required to perform this action."}</Text>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => handleNavigate('/auth/login')}
        >
          <Text style={styles.loginBtnText}>Login</Text>
        </TouchableOpacity>

        <View style={styles.signupRow}>
          <TouchableOpacity
            style={styles.signupBtn}
            onPress={() => handleNavigate('/auth/student-signup')}
          >
            <Text style={styles.signupBtnText}>Student Sign Up</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.signupBtn}
            onPress={() => handleNavigate('/auth/faculty-signup')}
          >
            <Text style={styles.signupBtnText}>Faculty Sign Up</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 24,
    paddingBottom: 44,
  },
  handleBar: {
    width: 32,
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 14,
    color: colors.textVeryMuted,
  },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 20,
  },
  loginBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginBtnText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  signupRow: {
    flexDirection: 'row',
    gap: 8,
  },
  signupBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  signupBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSubtle,
  },
});
