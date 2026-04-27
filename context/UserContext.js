import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getFacultyByEmail, updateFacultyProfile } from '../services/facultyService';
import { firestore } from '../services/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

const UserContext = createContext();

export const useProfile = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const { user, role, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    // If auth is still resolving or user unauthenticated, don't fetch
    if (!user || !role) {
      setProfile(null);
      setLoading(authLoading);
      return;
    }
    
    setLoading(true);
    try {
      let fetchedProfile = null;
      if (role === 'faculty') {
        fetchedProfile = await getFacultyByEmail(user.email);
      } else if (role === 'student') {
        // Fetch directly by UID — document was stored with user.uid as the key
        const docSnap = await getDoc(doc(firestore, 'students', user.uid));
        if (docSnap.exists()) {
          fetchedProfile = { id: docSnap.id, ...docSnap.data() };
        }
      }
      setProfile(fetchedProfile);
    } catch (error) {
      console.error("Error fetching user profile in UserContext:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user, role, authLoading]);

  const updateProfile = async (data) => {
    if (!profile) return false;
    try {
      if (role === 'faculty') {
        await updateFacultyProfile(profile.id, data);
      } else if (role === 'student') {
        const docRef = doc(firestore, 'students', profile.id);
        await updateDoc(docRef, data);
      }
      
      // Update local state optimizing for performance
      setProfile((prev) => ({ ...prev, ...data }));
      return true;
    } catch (error) {
      console.error("Error updating profile in UserContext:", error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <UserContext.Provider value={{ profile, loading, updateProfile, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
};
