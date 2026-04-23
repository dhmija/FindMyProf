import { firestore } from './firebase';
import { collection, doc, setDoc, addDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const getChatId = (facultyId, studentId) => `${facultyId}_${studentId}`;

export const initializeOrUpdateChat = async (facultyId, studentId, messageParams) => {
    const chatId = getChatId(facultyId, studentId);
    const chatRef = doc(firestore, 'chats', chatId);
    const docSnap = await getDoc(chatRef);
    
    const payload = {
        lastMessage: messageParams.text,
        lastMessageTimestamp: serverTimestamp(),
    };

    if (!docSnap.exists()) {
        // Initial creation
        await setDoc(chatRef, {
            ...payload,
            participants: [facultyId, studentId],
            facultyId,
            studentId,
            facultyName: messageParams.facultyName || 'Unknown Faculty',
            studentName: messageParams.studentName || 'Student',
        });
    } else {
        await updateDoc(chatRef, payload);
    }
    
    return chatId;
};

export const sendMessage = async (facultyId, studentId, text, senderId, facultyName, studentName) => {
  try {
      const chatId = await initializeOrUpdateChat(facultyId, studentId, { text, facultyName, studentName });
      const messagesRef = collection(firestore, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
          text,
          senderId,
          timestamp: serverTimestamp(),
          isSystem: false
      });
      return chatId;
  } catch(e) {
      console.error("Failed to send message", e); 
      throw e;
  }
};

export const sendQuickNotify = async (facultyId, studentId, facultyName, studentName) => {
    try {
        const text = `${studentName || 'A student'} is heading to your office`;
        const chatId = await initializeOrUpdateChat(facultyId, studentId, { text, facultyName, studentName });
        const messagesRef = collection(firestore, 'chats', chatId, 'messages');
        await addDoc(messagesRef, {
            text,
            senderId: studentId,
            timestamp: serverTimestamp(),
            isSystem: true
        });
    } catch(e) {
        console.error("Failed to send quick notify", e); 
        throw e;
    }
};

export const getMessages = async (chatId) => {
  // We recommend using onSnapshot directly in the React components for real-time reads.
  // This remains as a placeholder.
  return [];
};
