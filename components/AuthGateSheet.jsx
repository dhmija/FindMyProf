import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';

export default function AuthGateSheet({ visible, onClose, actionMessage, returnTo }) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

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
          style={[styles.btn, styles.loginBtn]} 
          onPress={() => handleNavigate('/auth/login')}
        >
          <Text style={styles.loginBtnText}>Login to Continue</Text>
        </TouchableOpacity>
        
        <View style={styles.divider}>
           <View style={styles.line}/>
           <Text style={styles.or}>OR</Text>
           <View style={styles.line}/>
        </View>

        <View style={styles.row}>
           <TouchableOpacity 
             style={[styles.btn, styles.linkBtn, { flex: 1, marginRight: 8 }]} 
             onPress={() => handleNavigate('/auth/student-signup')}
           >
             <Text style={styles.linkBtnText}>New Student?</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={[styles.btn, styles.linkBtn, { flex: 1, marginLeft: 8 }]} 
             onPress={() => handleNavigate('/auth/faculty-signup')}
           >
             <Text style={styles.linkBtnText}>New Faculty?</Text>
           </TouchableOpacity>
        </View>
        
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Custom requested semi-transparent
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#DDDDDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  message: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
    marginBottom: 24,
  },
  btn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtn: {
    backgroundColor: '#1E90FF',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  or: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linkBtn: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  linkBtnText: {
    color: '#1E90FF',
    fontSize: 14,
    fontWeight: 'bold',
  }
});
