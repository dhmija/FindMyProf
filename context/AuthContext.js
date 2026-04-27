import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firestore } from '../services/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { signIn, signUp, signOut as authServiceSignOut } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPersistedData = async () => {
      try {
        const storedRole = await SecureStore.getItemAsync('userRole');
        const storedUid = await SecureStore.getItemAsync('userUid');
        
        if (storedRole) {
          setUserRole(storedRole);
        }
        if (storedUid) {
          // Pre-populate a fake user envelope structurally mapped just to `uid` 
          // to bypass layout redirect flashes completely on boot!
          setCurrentUser({ uid: storedUid });
        }
      } catch (error) {
        console.error("Error reading persisted auth data:", error);
      }
    };

    checkPersistedData();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Overwrite the cached proxy explicitly once the socket validates natively
      if (user) {
         setCurrentUser(user);
         SecureStore.setItemAsync('userUid', user.uid);
      } else {
         setCurrentUser(null);
         SecureStore.deleteItemAsync('userUid');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password, role) => {
    try {
      const user = await signIn(email, password);
      
      // Prevent cross-login (e.g., student logging in as faculty)
      if (role === 'faculty') {
        const facQ = query(collection(firestore, 'faculties'), where('email', '==', email));
        const facSnap = await getDocs(facQ);
        if (facSnap.empty) {
          await authServiceSignOut();
          throw new Error("Access denied. No faculty profile found for this account.");
        }
      } else if (role === 'student') {
        const docSnap = await getDoc(doc(firestore, 'students', user.uid));
        if (!docSnap.exists()) {
          await authServiceSignOut();
          throw new Error("Access denied. No student profile found for this account.");
        }
      }

      await SecureStore.setItemAsync('userRole', role);
      await SecureStore.setItemAsync('userUid', user.uid);
      setUserRole(role);
      setCurrentUser(user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, role, profileData) => {
    try {
      const user = await signUp(email, password);
      await SecureStore.setItemAsync('userRole', role);
      await SecureStore.setItemAsync('userUid', user.uid);
      setUserRole(role);
      setCurrentUser(user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authServiceSignOut();
      await SecureStore.deleteItemAsync('userRole');
      await SecureStore.deleteItemAsync('userUid');
      setUserRole(null);
      setCurrentUser(null);
    } catch (error) {
      throw error;
    }
  };

  const setSessionRole = async (role) => {
    await SecureStore.setItemAsync('userRole', role);
    setUserRole(role);
  };

  return (
    <AuthContext.Provider value={{ user: currentUser, role: userRole, loading, login, logout, register, setSessionRole }}>
      {children}
    </AuthContext.Provider>
  );
};
