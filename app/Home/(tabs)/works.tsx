import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { useRouter } from 'expo-router';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';

const categories = [
  'Cleaning',
  'Plumbing',
  'Electrician',
  'Painting',
  'Carpentry',
  'Gardening',
  'Moving',
  'Cooking',
  'Babysitting',
  'Laundry',
  'AC Repair',
  'Pest Control',
  'Beauty',
  'Car Wash',
  'Computer Repair',
  'Mobile Repair',
  'Tutoring',
  'Photography',
  'Event Planning',
  'Security',
  'Other',
];

export default function WorksScreen() {
  const [works, setWorks] = useState<any[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const router = useRouter();

  const currentUser = getAuth().currentUser;

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'worked'));
        const worksList: any[] = [];

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          worksList.push({ id: docSnap.id, ...data });

          // Fetch full name of the poster if not already fetched
          if (data.userId && !userNames[data.userId]) {
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserNames((prev) => ({ ...prev, [data.userId]: userData.fullName }));
            }
          }
        }

        setWorks(worksList);
        setFilteredWorks(worksList);
      } catch (error) {
        console.error('Error fetching works:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorks();
  }, []);

  useEffect(() => {
    let filtered = works;

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

  const handleAccept = async (workId: string) => {
    if (!currentUser) {
      Alert.alert('Login Required', 'You must be logged in to accept work.');
      return;
    }

    try {
      const acceptingUserId = currentUser.uid;
      const workRef = doc(db, 'worked', workId);
      const userRef = doc(db, 'users', acceptingUserId);

      // Get the work doc first to know who posted it
      const workSnap = await getDoc(workRef);
      if (!workSnap.exists()) {
        Alert.alert('Error', 'Work not found.');
        return;
      }
      const workData = workSnap.data();

      // 1. Update the work document to accepted
      await updateDoc(workRef, {
        acceptedBy: acceptingUserId,
        acceptedAt: Timestamp.now(),
        status: 'pending',
      });

      // 2. Update the user's acceptedWorks array
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentAccepted: string[] = userData.acceptedWorks || [];

        if (!currentAccepted.includes(workId)) {
          await updateDoc(userRef, {
            acceptedWorks: [...currentAccepted, workId],
          });
        }
      }

      // 3. Create notification for the work poster
      if (workData.userId) {
        await addDoc(collection(db, 'notifications'), {
          toUserId: workData.userId,
          fromUserId: acceptingUserId,
          workId: workId,
          message: `Will you accept "${workData.jobTitle || 'Untitled'}" work?.`,
          createdAt: Timestamp.now(),
          read: false,
        });
      }

      // 4. Update UI locally
      setWorks((prev) =>
        prev.map((work) =>
          work.id === workId
            ? {
                ...work,
                acceptedBy: acceptingUserId,
                acceptedAt: new Date(),
                status: 'pending',
              }
            : work
        )
      );

      Alert.alert('Success', 'Work taken and notified!');
    } catch (error) {
      console.error('Error accepting work:', error);
      Alert.alert('Error', 'Something went wrong while accepting the work.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3a125d" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Available Works</Text>

      {/* Filter buttons */}
      <View style={styles.filtersRow}>
        <View style={styles.filterContainer}>
          <Ionicons name="filter" size={24} color="#3a125d" style={styles.filterIcon} />
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              onValueChange={(value) => setSelectedCategory(value)}
              placeholder={{ label: 'Select category...', value: '' }}
              items={categories.map((cat) => ({ label: cat, value: cat }))}
              style={pickerSelectStyles}
              value={selectedCategory}
              useNativeAndroidPickerStyle={false}
            />
          </View>
        </View>

        <View style={styles.filterContainer}>
          <Ionicons name="location" size={24} color="#3a125d" style={styles.filterIcon} />
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              onValueChange={(value) => setSelectedLocation(value)}
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
          <TouchableOpacity key={work.id} style={styles.workCard}>
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

            {work.status === 'active' && (
              <TouchableOpacity
                onPress={() => handleAccept(work.id)}
                style={styles.acceptButton}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3a125d',
    marginBottom: 20,
    textAlign: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  filterContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    elevation: 2,
  },
  filterIcon: {
    marginRight: 10,
  },
  pickerWrapper: {
    flex: 1,
  },
  noWorksText: {
    fontSize: 18,
    color: '#544d4d',
    textAlign: 'center',
    marginTop: 20,
  },
  workCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  workTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3a125d',
    marginBottom: 4,
  },
  workCategory: {
    fontSize: 14,
    color: '#19A7CE',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3a125d',
  },
  detailValue: {
    fontSize: 14,
    color: '#544d4d',
  },
  statusContainer: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: '#e8f5e9',
    color: '#4CAF50',
  },
  inactiveStatus: {
    backgroundColor: '#ffebee',
    color: '#F44336',
  },
  acceptButton: {
    marginTop: 12,
    backgroundColor: '#3a125d',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 14,
    color: '#3a125d',
    paddingVertical: 8,
    flex: 1,
  },
  inputAndroid: {
    fontSize: 14,
    color: '#3a125d',
    paddingVertical: 8,
    flex: 1,
  },
  placeholder: {
    color: '#888',
  },
});