// /category/[category].tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../firebaseConfig';

export const unstable_settings = {
  headerShown: false,
};


type Work = {
  id: string;
  jobTitle: string;
  price: number | string;
  description: string;
  location: string;
  endDate: any;
};

export default function CategoryScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams();

  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);

  // Map URL-friendly category slugs to Firestore category names exactly
  const categoryMap: Record<string, string> = {
    cleaning: 'Cleaning',
    plumbing: 'Plumbing',
    electrician: 'Electrician',
    painting: 'Painting',
    carpentry: 'Carpentry',
    gardening: 'Gardening',
    moving: 'Moving',
    cooking: 'Cooking',
    babysitting: 'Babysitting',
    laundry: 'Laundry',
    'ac-repair': 'AC Repair',
    'pest-control': 'Pest Control',
    beauty: 'Beauty',
    'car-wash': 'Car Wash',
    'computer-repair': 'Computer Repair',
    'mobile-repair': 'Mobile Repair',
    tutoring: 'Tutoring',
    photography: 'Photography',
    'event-planning': 'Event Planning',
    security: 'Security',
    other: 'Other',
  };

  useEffect(() => {
    if (!category) return;

    const fetchWorks = async () => {
      setLoading(true);

      try {
        // Normalize category param to lowercase slug
        const normalizedSlug = (category as string).toLowerCase();

        // Map slug to exact Firestore category
        const firestoreCategory = categoryMap[normalizedSlug];

        if (!firestoreCategory) {
          Alert.alert('Invalid category', 'This category does not exist.');
          setWorks([]);
          setLoading(false);
          return;
        }

        const worksRef = collection(db, 'worked');
        const q = query(worksRef, where('category', '==', firestoreCategory));
        const querySnapshot = await getDocs(q);

        const list: Work[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            jobTitle: data.jobTitle || 'Untitled Work',
            price: data.price ?? 'N/A',
            description: data.description || '',
            location: data.location || 'N/A',
            endDate: data.endDate || null,
          });
        });

        setWorks(list);
      } catch (error) {
        console.error('Error fetching category works:', error);
        Alert.alert('Error', 'Failed to load works for this category.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // Format only endDate as a readable date string (no time)
  const formatEndDate = (date: any) => {
    if (!date) return 'N/A';
    let jsDate;
    if (date.toDate) {
      jsDate = date.toDate();
    } else {
      jsDate = new Date(date);
    }
    return jsDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: Work }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/works/${item.id}`)} // Navigate to work details
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.jobTitle}</Text>
        <Text style={styles.price}>৳{item.price}</Text>
      </View>
      <Text style={styles.description}>{item.description}</Text>
      <View style={styles.dashedLine} />
      <View style={styles.cardFooter}>
        <View style={styles.locationRow}>
          <Ionicons name="location-sharp" size={16} color="#636060" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
        <Text style={styles.datetime}>
          {formatEndDate(item.endDate)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3a125d" barStyle="light-content" />
      {/* Remove your own header here since system header is hidden */}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#3a125d', fontSize: 16 }}>Loading works...</Text>
        </View>
      ) : works.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#3a125d', fontSize: 16 }}>
            No works found in this category.
          </Text>
        </View>
      ) : (
        <FlatList
          data={works}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6e9fdff',
  },
  list: {
    padding: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3a125d',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f9a805ff',
  },
  description: {
    fontSize: 14,
    color: '#585454ff',
    marginBottom: 5,
  },
  dashedLine: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#3a125d',
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#04ad2eff',
  },
  datetime: {
    fontSize: 13,
    color: '#04ad2eff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
