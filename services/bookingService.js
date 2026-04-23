import { firestore } from './firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export const requestBooking = async (facultyId, facultyName, studentId, studentName, slotString) => {
  try {
    const bookingsRef = collection(firestore, 'bookings');
    await addDoc(bookingsRef, {
      facultyId,
      facultyName,
      studentId,
      studentName,
      slot: slotString,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.error("Booking error:", e);
    throw e;
  }
};

export const updateBookingStatus = async (bookingId, newStatus) => {
  try {
    const docRef = doc(firestore, 'bookings', bookingId);
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.error("Updating booking error:", e);
    throw e;
  }
};
