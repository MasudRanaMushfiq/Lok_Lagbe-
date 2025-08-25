import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    collection,
    doc,
    getDoc,
    getDocs,
} from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { db } from '../../../firebaseConfig';

const categories = [
  'Cleaning', 'Plumbing', 'Electrician', 'Painting', 'Carpentry', 'Gardening',
  'Moving', 'Cooking', 'Babysitting', 'Laundry', 'AC Repair', 'Pest Control',
  'Beauty', 'Car Wash', 'Computer Repair', 'Mobile Repair', 'Tutoring',
  'Photography', 'Event Planning', 'Security', 'Other',
];

export default function WorksScreen() {
  const [works, setWorks] = useState<any[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // For pull to refresh
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const router = useRouter();

  // Fetch works function extracted to reuse for initial load and refresh
  const fetchWorks = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);

      const querySnapshot = await getDocs(collection(db, 'worked'));
      const worksList: any[] = [];
      const userIdSet = new Set<string>();

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        worksList.push({ id: docSnap.id, ...data });
        if (data.userId) userIdSet.add(data.userId);
      });

      // Fetch user names in parallel
      const userDocs = await Promise.all(
        Array.from(userIdSet).map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          return userDoc.exists() ? { uid, fullName: userDoc.data().fullName } : null;
        })
      );

      const namesMap: Record<string, string> = {};
      userDocs.forEach((u) => {
        if (u) namesMap[u.uid] = u.fullName;
      });

      setUserNames(namesMap);
      setWorks(worksList);
      setFilteredWorks(worksList);
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  useEffect(() => {
    let filtered = [...works];
    if (selectedCategory) {
      filtered = filtered.filter((work) => work.category === selectedCategory);
    }
    if (selectedLocation) {
      filtered = filtered.filter(
        (work) => work.location?.toLowerCase() === selectedLocation.toLowerCase()
      );
    }
    setFilteredWorks(filtered);
  }, [selectedCategory, selectedLocation, works]);

  // Handler for pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchWorks();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3897f0" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3897f0']} />
      }
    >
      <Text style={styles.header}>Available Works</Text>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <View style={styles.filterContainer}>
          <Ionicons name="filter" size={24} color="#3897f0" style={styles.filterIcon} />
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              onValueChange={setSelectedCategory}
              placeholder={{ label: 'Select category...', value: '' }}
              items={categories.map((cat) => ({ label: cat, value: cat }))}
              style={pickerSelectStyles}
              value={selectedCategory}
              useNativeAndroidPickerStyle={false}
            />
          </View>
        </View>

        <View style={styles.filterContainer}>
          <Ionicons name="location" size={24} color="#3897f0" style={styles.filterIcon} />
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              onValueChange={setSelectedLocation}
              placeholder={{ label: 'Select location...', value: '' }}
              items={[...new Set(works.map((w) => w.location))].map((loc) => ({
                label: loc,
                value: loc,
              }))}
              style={pickerSelectStyles}
              value={selectedLocation}
              useNativeAndroidPickerStyle={false}
            />
          </View>
        </View>
      </View>

      {filteredWorks.length === 0 ? (
        <Text style={styles.noWorksText}>No works found for selected filters</Text>
      ) : (
        filteredWorks.map((work) => (
          <TouchableOpacity
            key={work.id}
            style={styles.workCard}
            onPress={() => router.push({ pathname: '/works/[work]', params: { work: work.id } })}
          >
            <Text style={styles.workTitle}>{work.jobTitle}</Text>
            <Text style={styles.workCategory}>{work.category}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price:</Text>
              <Text style={styles.detailValue}>৳{work.price}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{work.location}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Posted by:</Text>
              <Text style={styles.detailValue}>
                {userNames[work.userId] || 'Loading...'}
              </Text>
            </View>

            <View style={styles.statusContainer}>
              <Text
                style={[
                  styles.statusText,
                  work.status === 'active' ? styles.activeStatus : styles.inactiveStatus,
                ]}
              >
                {work.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#3897f0',marginTop: 20, marginBottom: 20, textAlign: 'center' },
  filtersRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  filterContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 10, elevation: 2 },
  filterIcon: { marginRight: 10 },
  pickerWrapper: { flex: 1 },
  noWorksText: { fontSize: 18, color: '#544d4d', textAlign: 'center', marginTop: 20 },
  workCard: { backgroundColor: 'white', borderRadius: 10, padding: 16, marginBottom: 16, elevation: 2 },
  workTitle: { fontSize: 18, fontWeight: 'bold', color: '#3897f0', marginBottom: 4 },
  workCategory: { fontSize: 14, color: '#19A7CE', marginBottom: 12, fontStyle: 'italic' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { fontSize: 14, fontWeight: '600', color: '#3a125d' },
  detailValue: { fontSize: 14, color: '#544d4d' },
  statusContainer: { marginTop: 10, alignItems: 'flex-end' },
  statusText: { fontSize: 14, fontWeight: 'bold', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeStatus: { backgroundColor: '#e8f5e9', color: '#4CAF50' },
  inactiveStatus: { backgroundColor: '#ffebee', color: '#F44336' },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: { fontSize: 14, color: '#3897f0', paddingVertical: 8, flex: 1 },
  inputAndroid: { fontSize: 14, color: '#3897f0', paddingVertical: 8, flex: 1 },
  placeholder: { color: '#888' },
});
