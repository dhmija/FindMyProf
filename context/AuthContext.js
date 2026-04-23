import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { signIn, signUp, signOut as authServiceSignOut } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPersistedRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('userRole');
        if (storedRole) {
          setUserRole(storedRole);
        }
      } catch (error) {
        console.error("Error reading persisted role:", error);
      }
    };

    checkPersistedRole();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password, role) => {
    try {
      const user = await signIn(email, password);
      await AsyncStorage.setItem('userRole', role);
      setUserRole(role);
      setCurrentUser(user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, role, profileData) => {
    try {
      const user = await signUp(email, password);
      await AsyncStorage.setItem('userRole', role);
      setUserRole(role);
      setCurrentUser(user);
      // Profile document creation logic mapping to profileData should be handled 
      // globally or inside the register flow based on use-case later.
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authServiceSignOut();
      await AsyncStorage.removeItem('userRole');
      setUserRole(null);
      // currentUser will automatically become null from onAuthStateChanged
    } catch (error) {
      throw error;
    }
  };

  const setSessionRole = async (role) => {
    await AsyncStorage.setItem('userRole', role);
    setUserRole(role);
  };

  return (
    <AuthContext.Provider value={{ user: currentUser, role: userRole, loading, login, logout, register, setSessionRole }}>
      {children}
    </AuthContext.Provider>
  );
};
