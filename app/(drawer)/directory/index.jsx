import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllFaculties } from '../../../services/facultyService';
import FacultyCard from '../../../components/FacultyCard';

const BLOCKS = ['All', 'M', 'N1', 'N2'];
const FLOORS = ['1', '2', '3'];

export default function DirectoryIndex() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  
  const [filterBlock, setFilterBlock] = useState('All');
  const [filterFloor, setFilterFloor] = useState(null);

  const fetchFaculties = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem('@faculties_cache');
      if (cached) {
        setFaculties(JSON.parse(cached));
        setLoading(false); // Render cache immediately
      }

      const freshData = await getAllFaculties();
      setFaculties(freshData);
      await AsyncStorage.setItem('@faculties_cache', JSON.stringify(freshData));
    } catch (error) {
      console.error("Error fetching faculties:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFaculties();
  }, [fetchFaculties]);

  const handleSearchChange = useCallback((text) => {
    setSearchText(text);
  }, []);

  const handleBlockChange = useCallback((block) => {
    setFilterBlock(block);
    // Reset floor filter when switching to a block that has no floors
    if (block !== 'M') {
      setFilterFloor(null);
    }
  }, []);

  const handleFloorChange = useCallback((floor) => {
    setFilterFloor(floor);
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

  const renderItem = useCallback(({ item }) => (
    <FacultyCard faculty={item} />
  ), []);

  const getItemLayout = useCallback((data, index) => (
    // Assuming card height + margins averages out to about 130px statically.
    // This dramatically improves large list memory rendering.
    { length: 130, offset: 130 * index, index }
  ), []);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, department, subject..."
          value={searchText}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
          <Text style={styles.filterLabel}>Block:</Text>
          {BLOCKS.map(block => (
            <TouchableOpacity 
              key={`block-${block}`} 
              style={[styles.chip, filterBlock === block && styles.chipActive]}
              onPress={() => handleBlockChange(block)}
            >
              <Text style={[styles.chipText, filterBlock === block && styles.chipActiveText]}>{block}</Text>
            </TouchableOpacity>
          ))}
          
          {filterBlock === 'M' && (
            <>
              <View style={styles.filterDivider} />
              
              <Text style={styles.filterLabel}>Floor:</Text>
              {FLOORS.map(floor => (
                <TouchableOpacity 
                  key={`floor-${floor}`} 
                  style={[styles.chip, filterFloor === floor && styles.chipActive]}
                  onPress={() => handleFloorChange(floor)}
                >
                  <Text style={[styles.chipText, filterFloor === floor && styles.chipActiveText]}>{floor}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>

      {/* List content */}
      {loading && faculties.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1E90FF" />
          <Text style={styles.loadingText}>Fetching Directory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFaculties}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No faculty members found matching your search.</Text>
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
    backgroundColor: '#FAFAFA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 24,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filtersWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 12,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
  },
  filterLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginRight: 8,
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#D0D0D0',
    marginHorizontal: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: '#1E90FF',
  },
  chipText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  chipActiveText: {
    color: '#fff',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 40,
  }
});
