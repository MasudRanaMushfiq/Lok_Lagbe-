import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { db } from '../../firebaseConfig';

const categories = [
  'Cleaning', 'Plumbing', 'Electrician', 'Painting', 'Carpentry', 'Gardening',
  'Moving', 'Cooking', 'Babysitting', 'Laundry', 'AC Repair', 'Pest Control',
  'Beauty', 'Car Wash', 'Computer Repair', 'Mobile Repair', 'Tutoring',
  'Photography', 'Event Planning', 'Security', 'Other',
];

export default function AllPostsScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const router = useRouter();

  // Fetch posts & user names (including completedBy users)
  const fetchPosts = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);

      const postsSnap = await getDocs(collection(db, 'worked'));
      const postsList: any[] = [];
      const userIdSet = new Set<string>();

      postsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        postsList.push({ id: docSnap.id, ...data });
        if (data.userId) userIdSet.add(data.userId);
        if (data.completedBy) userIdSet.add(data.completedBy);
      });

      // Fetch user names
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
      setPosts(postsList);
      setFilteredPosts(postsList);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Apply filters
  useEffect(() => {
    let filtered = [...posts];
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }
    if (selectedLocation) {
      filtered = filtered.filter(
        (p) => p.location?.toLowerCase() === selectedLocation.toLowerCase()
      );
    }
    setFilteredPosts(filtered);
  }, [selectedCategory, selectedLocation, posts]);

  // Delete post handler with confirmation and error handling
  const deletePost = (postId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'worked', postId));
              // Update local state by filtering out deleted post
              setPosts((prev) => prev.filter((p) => p.id !== postId));
              Alert.alert('Deleted', 'Post has been deleted.');
            } catch (error) {
              console.error('Error deleting post:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3a125d" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3a125d']} />
      }
    >
      <Text style={styles.header}>All Posts</Text>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <View style={styles.filterContainer}>
          <Ionicons name="filter" size={24} color="#3a125d" style={styles.filterIcon} />
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
          <Ionicons name="location" size={24} color="#3a125d" style={styles.filterIcon} />
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              onValueChange={setSelectedLocation}
              placeholder={{ label: 'Select location...', value: '' }}
              items={[...new Set(posts.map((p) => p.location))].map((loc) => ({
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

      {filteredPosts.length === 0 ? (
        <Text style={styles.noWorksText}>No posts found for selected filters</Text>
      ) : (
        filteredPosts.map((post) => (
          <View key={post.id} style={styles.workCard}>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/works/[work]', params: { work: post.id } })}
            >
              <Text style={styles.workTitle}>{post.jobTitle || post.title || 'No Title'}</Text>
              <Text style={styles.workCategory}>{post.category}</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price:</Text>
                <Text style={styles.detailValue}>৳{post.price ?? 'N/A'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>{post.location ?? 'N/A'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Posted by:</Text>
                <Text style={styles.detailValue}>
                  {userNames[post.userId] || 'Loading...'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Time:</Text>
                <Text style={styles.detailValue}>
                  {post.endTime
                    ? new Date(post.endTime.seconds * 1000).toLocaleString()
                    : 'N/A'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>{post.description || 'No description'}</Text>
              </View>

              {post.status === 'completed' && post.completedBy && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Completed by:</Text>
                  <Text style={styles.detailValue}>
                    {userNames[post.completedBy] || 'Loading...'}
                  </Text>
                </View>
              )}

              <View style={styles.statusContainer}>
                <Text
                  style={[
                    styles.statusText,
                    post.status === 'active' ? styles.activeStatus : styles.inactiveStatus,
                  ]}
                >
                  {post.status}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => deletePost(post.id)}
            >
              <Ionicons name="trash" size={20} color="#e63946" />
              <Text style={styles.deleteText}>Delete Post</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3a125d',
    marginTop: 20,
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
  filterIcon: { marginRight: 10 },
  pickerWrapper: { flex: 1 },
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
  },
  workTitle: { fontSize: 18, fontWeight: 'bold', color: '#3a125d', marginBottom: 4 },
  workCategory: { fontSize: 14, color: '#19A7CE', marginBottom: 12, fontStyle: 'italic' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: { fontSize: 14, fontWeight: '600', color: '#3a125d' },
  detailValue: { fontSize: 14, color: '#544d4d', maxWidth: '70%' },
  statusContainer: { marginTop: 10, alignItems: 'flex-end' },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: { backgroundColor: '#e8f5e9', color: '#4CAF50' },
  inactiveStatus: { backgroundColor: '#ffebee', color: '#F44336' },
  deleteBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    elevation: 1,
  },
  deleteText: {
    color: '#e63946',
    fontWeight: '600',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: { fontSize: 14, color: '#3a125d', paddingVertical: 8, flex: 1 },
  inputAndroid: { fontSize: 14, color: '#3a125d', paddingVertical: 8, flex: 1 },
  placeholder: { color: '#888' },
});
