import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { firestore } from '../../../services/firebase';
import FacultyCard from '../../../components/FacultyCard';

const BLOCKS = ['All', 'M', 'N1', 'N2'];
const FLOORS = ['1', '2', '3'];

export default function DirectoryIndex() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const [filterBlock, setFilterBlock] = useState('All');
  const [filterFloor, setFilterFloor] = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(firestore, 'faculties'));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setFaculties(data);
        setLoading(false);
      },
      (err) => {
        console.error('Directory snapshot error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleSearchChange = useCallback((text) => setSearchText(text), []);

  const handleBlockChange = useCallback((block) => {
    setFilterBlock(block);
    if (block !== 'M') setFilterFloor(null);
  }, []);

  const handleFloorChange = useCallback((floor) => {
    setFilterFloor(prev => prev === floor ? null : floor);
  }, []);

  const filteredFaculties = useMemo(() => {
    return faculties.filter(f => {
      const query = searchText.toLowerCase();
      const matchesSearch = query === '' ||
        f.name?.toLowerCase().includes(query) ||
        f.department?.toLowerCase().includes(query) ||
        (Array.isArray(f.subjects) && f.subjects.some(s => s.toLowerCase().includes(query)));
      const matchesBlock = filterBlock === 'All' || f.block === filterBlock;
      const matchesFloor = filterFloor === null || f.floor?.toString() === filterFloor;
      return matchesSearch && matchesBlock && matchesFloor;
    });
  }, [faculties, searchText, filterBlock, filterFloor]);

  const renderItem = useCallback(({ item }) => <FacultyCard faculty={item} />, []);
  const getItemLayout = useCallback((_, index) => ({ length: 73, offset: 73 * index, index }), []);
  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, department, subject…"
          placeholderTextColor="#bbb"
          value={searchText}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Block filter */}
      <View style={styles.filterRow}>
        {BLOCKS.map(block => (
          <TouchableOpacity
            key={block}
            style={[styles.pill, filterBlock === block && styles.pillActive]}
            onPress={() => handleBlockChange(block)}
          >
            <Text style={[styles.pillText, filterBlock === block && styles.pillTextActive]}>
              {block}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Floor filter — only for M Block */}
      {filterBlock === 'M' && (
        <View style={styles.filterRow}>
          {FLOORS.map(floor => (
            <TouchableOpacity
              key={floor}
              style={[styles.pillSmall, filterFloor === floor && styles.pillActive]}
              onPress={() => handleFloorChange(floor)}
            >
              <Text style={[styles.pillSmallText, filterFloor === floor && styles.pillTextActive]}>
                Floor {floor}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.divider} />

      {loading && faculties.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a1a1a" />
          <Text style={styles.loadingText}>Loading directory…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFaculties}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews={true}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No results found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf8',
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  searchInput: {
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafaf8',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  pillActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  pillTextActive: {
    color: '#fafaf8',
  },
  pillSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d0d0d0',
  },
  pillSmallText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#555555',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#aaa',
  },
  emptyText: {
    fontSize: 14,
    color: '#bbb',
  },
  listContent: {
    paddingBottom: 40,
  },
});
