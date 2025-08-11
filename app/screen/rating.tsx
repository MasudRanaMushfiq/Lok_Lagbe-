import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';

export default function RatingScreen() {
  const { ratedUserId } = useLocalSearchParams<{ ratedUserId: string }>();
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');
  const router = useRouter();
  const currentUser = getAuth().currentUser;

  useEffect(() => {
    if (!ratedUserId) {
      Alert.alert('Error', 'No user to rate');
      router.back();
      return;
    }

    async function fetchUser() {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', ratedUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserName(userData.fullName || userData.name || 'User');
        } else {
          Alert.alert('Error', 'User not found');
          router.back();
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        Alert.alert('Error', 'Failed to load user data');
        router.back();
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [ratedUserId]);

  const submitRating = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Invalid Rating', 'Please select a rating between 1 and 5 stars.');
      return;
    }
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to submit a rating.');
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, 'users', ratedUserId);

      // Fetch current rating and count
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        Alert.alert('Error', 'User not found.');
        setLoading(false);
        return;
      }
      const userData = userSnap.data();

      // Existing average rating and number of ratings, or default 0
      const oldRating = userData.rating || 0;
      const oldRatingCount = userData.ratingCount || 0;

      // Calculate new average rating
      const newRatingCount = oldRatingCount + 1;
      const newRating = (oldRating * oldRatingCount + rating) / newRatingCount;

      // Update user's rating and count
      await updateDoc(userRef, {
        rating: newRating,
        ratingCount: newRatingCount,
        // Optionally save individual reviews/comments
        reviews: arrayUnion({
          reviewerId: currentUser.uid,
          rating,
          comment,
          timestamp: new Date(),
        }),
      });

      Alert.alert('Success', 'Rating submitted successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating.');
    } finally {
      setLoading(false);
    }
  };

  const renderStar = (starNumber: number) => {
    return (
      <TouchableOpacity
        key={starNumber}
        onPress={() => setRating(starNumber)}
        style={{ marginHorizontal: 4 }}
      >
        <Text style={[styles.star, rating >= starNumber ? styles.starSelected : styles.starUnselected]}>
          ★
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, styles.background]}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.background]}>
      <Text style={styles.header}>Rate {userName}</Text>

      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map(renderStar)}
      </View>

      <TextInput
        style={styles.textInput}
        placeholder="Leave a comment (optional)"
        multiline
        numberOfLines={4}
        value={comment}
        onChangeText={setComment}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={submitRating}>
        <Text style={styles.submitBtnText}>Submit Rating</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 20,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1877F2',
    textAlign: 'center',
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  star: {
    fontSize: 40,
  },
  starSelected: {
    color: '#fbc02d',
  },
  starUnselected: {
    color: '#ddd',
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#1877F2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
