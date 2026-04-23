import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { firestore } from '../../../services/firebase';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'expo-router';

const ChatThread = React.memo(({ item, role, onPress }) => {
  const displayName = role === 'faculty' ? item.studentName : item.facultyName;
  const timeStr = item.lastMessageTimestamp 
    ? new Date(item.lastMessageTimestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : '';

  return (
    <TouchableOpacity style={styles.threadCard} onPress={() => onPress(item.id, item.facultyId, item.studentId, displayName)}>
      <View style={styles.threadHeader}>
        <Text style={styles.threadName}>{displayName}</Text>
        <Text style={styles.threadTime}>{timeStr}</Text>
      </View>
      <Text style={styles.threadMessage} numberOfLines={1}>{item.lastMessage}</Text>
    </TouchableOpacity>
  );
});

export default function MessagesIndex() {
  const { user, role } = useAuth();
  const router = useRouter();
  
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const chatsRef = collection(firestore, 'chats');
    const q = query(
      chatsRef, 
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTimestamp', 'desc') // Requires composite index potentially
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveThreads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setThreads(liveThreads);
      setLoading(false);
    }, (error) => {
      // Incase index is missing, fallback listener
      console.error(error);
      const fallbackQ = query(chatsRef, where('participants', 'array-contains', user.uid));
      onSnapshot(fallbackQ, (fallbackSnap) => {
          const fbThreads = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          fbThreads.sort((a,b) => (b.lastMessageTimestamp?.toMillis() || 0) - (a.lastMessageTimestamp?.toMillis() || 0));
          setThreads(fbThreads);
          setLoading(false);
      });
    });

    return () => unsubscribe();
  }, [user]);

  const handlePress = useCallback((chatId, facultyId, studentId, displayName) => {
    router.push({
      pathname: `/messages/${chatId}`,
      params: { facultyId, studentId, displayName }
    });
  }, [router]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={threads}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ChatThread item={item} role={role} onPress={handlePress} />
        )}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No active conversations found.</Text>
          </View>
        }
      />
    </View>
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
    padding: 24,
  },
  listContent: {
    padding: 16,
  },
  threadCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  threadName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  threadTime: {
    fontSize: 12,
    color: '#999',
  },
  threadMessage: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  }
});
