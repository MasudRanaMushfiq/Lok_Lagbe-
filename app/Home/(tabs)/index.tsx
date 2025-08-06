import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../../firebaseConfig';

const categories = [
  { name: 'Cleaning', icon: 'broom' },
  { name: 'Plumbing', icon: 'pipe-wrench' },
  { name: 'Electrician', icon: 'flash' },
  { name: 'Painting', icon: 'format-paint' },
  { name: 'Carpentry', icon: 'hammer' },
  { name: 'Gardening', icon: 'flower' },
  { name: 'Moving', icon: 'truck-fast' },
  { name: 'Cooking', icon: 'chef-hat' },
  { name: 'Babysitting', icon: 'baby-face-outline' },
  { name: 'Laundry', icon: 'washing-machine' },
  { name: 'AC Repair', icon: 'air-conditioner' },
  { name: 'Pest Control', icon: 'bug' },
  { name: 'Beauty', icon: 'face-woman' },
  { name: 'Car Wash', icon: 'car-wash' },
  { name: 'Computer Repair', icon: 'laptop' },
  { name: 'Mobile Repair', icon: 'cellphone-cog' },
  { name: 'Tutoring', icon: 'book-open-variant' },
  { name: 'Photography', icon: 'camera' },
  { name: 'Event Planning', icon: 'calendar-star' },
  { name: 'Security', icon: 'shield-account' },
  { name: 'Other', icon: 'dots-horizontal' },
];

const { width } = Dimensions.get('window');
const numColumns = 3;
const horizontalMargin = 6;
const cardWidth = (width - 2 * 16 - (numColumns * 2 * horizontalMargin)) / numColumns;

export default function HomeScreen() {
  const router = useRouter();

  const handleCategoryPress = (category) => {
    if (category.name === 'Cleaning') {
      router.push('/Home/clean');
    } else {
      console.log('Pressed:', category.name);
    }
  };

  const handleNotificationPress = async () => {
    try {
      const user = getAuth().currentUser;

      if (!user) {
        Alert.alert('Not logged in', 'Please log in to view notifications.');
        return;
      }

      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where('toUserId', '==', user.uid), where('read', '==', false));
      const querySnapshot = await getDocs(q);

      // Now navigate to notifications page
      router.push('/notification');
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      Alert.alert('Error', 'Failed to load notifications.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headingRow}>
          <View style={styles.headingWrap}>
            <Text style={styles.heading}>Lok Lagbe?</Text>
            <Text style={styles.tagline}>Find trusted professionals for any service</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            activeOpacity={0.7}
            onPress={handleNotificationPress}
          >
            <MaterialCommunityIcons name="bell-outline" size={28} color="#ff6347" />
          </TouchableOpacity>
        </View>

        <Text style={styles.categoriesHeading}>Categories</Text>

        <FlatList
          data={categories}
          keyExtractor={(item) => item.name}
          numColumns={numColumns}
          contentContainerStyle={styles.categoryGrid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.categoryCard}
              activeOpacity={0.85}
              onPress={() => handleCategoryPress(item)}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={26}
                color="#ff6347"
                style={{ marginBottom: 6 }}
              />
              <Text style={styles.categoryText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.postBtnWrap}>
          <TouchableOpacity
            style={styles.postBtn}
            activeOpacity={0.9}
            onPress={() => router.push('/post-your-work')}
          >
            <Text style={styles.postBtnText}>Post your work</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f7fb',
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f7fb',
    paddingTop: 38,
    paddingHorizontal: 16,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginTop: 8,
  },
  headingWrap: {
    flex: 1,
    paddingRight: 8,
  },
  heading: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#222',
    letterSpacing: 0.5,
    marginBottom: 2,
    textAlign: 'left',
    lineHeight: 38,
  },
  tagline: {
    fontSize: 15,
    color: '#888',
    marginBottom: 0,
    textAlign: 'left',
    marginTop: 2,
  },
  notificationBtn: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#ff6347',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    alignSelf: 'flex-start',
  },
  categoriesHeading: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: '#222',
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  categoryGrid: {
    paddingBottom: 90,
  },
  categoryCard: {
    backgroundColor: '#fff',
    width: cardWidth,
    marginHorizontal: horizontalMargin,
    marginVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    elevation: 2,
    shadowRadius: 2,
  },
  categoryText: {
    fontSize: 13,
    color: '#ff6347',
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  postBtnWrap: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  postBtn: {
    backgroundColor: '#ff6347',
    paddingVertical: 10,
    paddingHorizontal: 48,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#ff6347',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  postBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
