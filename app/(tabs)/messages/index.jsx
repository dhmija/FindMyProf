import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { firestore } from '../../../services/firebase';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useRouter } from 'expo-router';

const ChatThread = React.memo(({ item, role, onPress }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
  const { colors } = useTheme();
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (!user?.uid) return;

    const chatsRef = collection(firestore, 'chats');
    const q = query(
      chatsRef, 
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTimestamp', 'desc') 
    );

    let fallbackUnsubscribe = null;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveThreads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setThreads(liveThreads);
      setLoading(false);
    }, (error) => {
      // After logout, Firebase fires permission-denied — bail out silently.
      if (error.code === 'permission-denied') {
        setLoading(false);
        return;
      }
      console.error(error);
      const fallbackQ = query(chatsRef, where('participants', 'array-contains', user.uid));
      fallbackUnsubscribe = onSnapshot(fallbackQ, (fallbackSnap) => {
          const fbThreads = fallbackSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          fbThreads.sort((a,b) => (b.lastMessageTimestamp?.toMillis() || 0) - (a.lastMessageTimestamp?.toMillis() || 0));
          setThreads(fbThreads);
          setLoading(false);
      }, (fbError) => {
          if (fbError.code !== 'permission-denied') console.error(fbError);
      });
    });

    return () => {
      unsubscribe();
      if (fallbackUnsubscribe) {
         fallbackUnsubscribe();
      }
    };
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
        <ActivityIndicator size="large" color={colors.text} />
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

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
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
    color: colors.text,
  },
  threadTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  threadMessage: {
    fontSize: 14,
    color: colors.textSubtle,
  },
  emptyText: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
