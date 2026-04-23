import { firestore } from './firebase';
import { collection, getDocs, doc, updateDoc, query, where, setDoc, deleteDoc } from 'firebase/firestore';

const FACULTY_COLLECTION = 'faculties';

export const getAllFaculties = async () => {
  try {
    const facultyRef = collection(firestore, FACULTY_COLLECTION);
    const snapshot = await getDocs(facultyRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting all faculties:", error);
    throw error;
  }
};

export const getFacultyByEmail = async (email) => {
  try {
    const facultyRef = collection(firestore, FACULTY_COLLECTION);
    const q = query(facultyRef, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting faculty by email:", error);
    throw error;
  }
};

export const updateFacultyProfile = async (id, data) => {
  try {
    const docRef = doc(firestore, FACULTY_COLLECTION, id);
    await updateDoc(docRef, data);
    return true;
  } catch (error) {
    console.error("Error updating faculty profile:", error);
    throw error;
  }
};

export const claimFacultyProfile = async (email, uid) => {
  try {
    const facultyRef = collection(firestore, FACULTY_COLLECTION);
    const q = query(facultyRef, where("email", "==", email));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const seededDoc = snapshot.docs[0];
      const seededData = seededDoc.data();
      
      await setDoc(doc(firestore, FACULTY_COLLECTION, uid), { 
        ...seededData,
        claimedByUid: uid, 
        claimedAt: new Date().toISOString(),
        isRegistered: true
      });
      
      await deleteDoc(doc(firestore, FACULTY_COLLECTION, seededDoc.id));
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error claiming faculty profile:", error);
    throw error;
  }
};
