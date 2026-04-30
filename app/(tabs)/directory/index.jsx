import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { firestore } from '../../../services/firebase';
import { useTheme } from '../../../context/ThemeContext';
import FacultyCard from '../../../components/FacultyCard';

const BLOCKS = ['All', 'M', 'N1', 'N2'];
const FLOORS = ['1', '2', '3'];

export default function DirectoryIndex() {
  const { colors } = useTheme();
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterBlock, setFilterBlock] = useState('All');
  const [filterFloor, setFilterFloor] = useState(null);

  const styles = useMemo(() => makeStyles(colors), [colors]);

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
          <ActivityIndicator size="large" color={colors.text} />
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

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  searchInput: {
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.inputBg,
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
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSubtle,
  },
  pillTextActive: {
    color: colors.primaryText,
  },
  pillSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSmallText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSubtle,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
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
    color: colors.textVeryMuted,
  },
  emptyText: {
    fontSize: 14,
    color: colors.placeholder,
  },
  listContent: {
    paddingBottom: 40,
  },
});
