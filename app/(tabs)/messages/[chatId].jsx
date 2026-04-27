import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../services/firebase';
import { useAuth } from '../../../context/AuthContext';
import { sendMessage } from '../../../services/chatService';
import { useProfile } from '../../../context/UserContext';

export default function ChatScreen() {
  const { chatId, facultyId, studentId, displayName } = useLocalSearchParams();
  const { user, role } = useAuth();
  const { profile } = useProfile();
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [facultyAllowed, setFacultyAllowed] = useState(true);

  useEffect(() => {
    navigation.setOptions({ 
      title: displayName || 'Chat',
      headerShown: true
    });
  }, [displayName, navigation]);

  // Validation strictly evaluating constraints
  useEffect(() => {
    const fetchConstraints = async () => {
      if (!facultyId) return;
      
      if (role === 'student') {
         const docSnap = await getDoc(doc(firestore, 'faculties', facultyId));
         if (docSnap.exists()) {
             setFacultyAllowed(docSnap.data().acceptsMessages !== false);
         }
      }
    };
    fetchConstraints();
  }, [facultyId, role]);

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(firestore, 'chats', chatId, 'messages');
    // Using descending order because the FlatList uses inverted structure
    const q = query(messagesRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveMsgs = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setMessages(liveMsgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      const facName = role === 'faculty' ? profile?.name : displayName;
      const studName = role === 'student' ? (profile?.fullName || profile?.name) : displayName;
      
      await sendMessage(facultyId, studentId, inputText.trim(), user.uid, facName, studName);
      setInputText('');
    } catch (e) {
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user?.uid;
    if (item.isSystem) {
       return (
         <View style={styles.systemBubble}>
           <Text style={styles.systemText}>{item.text}</Text>
         </View>
       );
    }

    return (
      <View style={[styles.bubbleWrapper, isMe ? styles.bubbleWrapperRight : styles.bubbleWrapperLeft]}>
        <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
          <Text style={[styles.messageText, isMe && styles.messageTextRight]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container} keyboardVerticalOffset={headerHeight}>
      {!facultyAllowed && (
        <View style={styles.disabledBanner}>
          <Text style={styles.disabledBannerText}>This faculty is currently not accepting direct messages.</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#1E90FF" />
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          inverted
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          editable={facultyAllowed}
        />
        <TouchableOpacity style={[styles.sendBtn, !facultyAllowed && styles.sendBtnDisabled]} onPress={handleSend} disabled={!inputText.trim() || sending || !facultyAllowed}>
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.sendText}>Send</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBanner: {
    backgroundColor: '#FFEAEA',
    padding: 12,
    alignItems: 'center',
  },
  disabledBannerText: {
    color: '#D8000C',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  bubbleWrapper: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  bubbleWrapperLeft: {
    justifyContent: 'flex-start',
  },
  bubbleWrapperRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleLeft: {
    backgroundColor: '#E0E0E0',
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: '#1E90FF',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#333',
  },
  messageTextRight: {
    color: '#fff',
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  systemText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: '#111',
    width: 60,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: '#e5e5e5',
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
