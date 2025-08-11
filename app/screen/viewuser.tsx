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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Helper to render stars for rating
function Stars({ rating }: { rating: number }) {
  const filledStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - filledStars - (halfStar ? 1 : 0);

  return (
    <View style={{ flexDirection: 'row' }}>
      {[...Array(filledStars)].map((_, i) => (
        <Text key={'fs' + i} style={styles.star}>★</Text>
      ))}
      {halfStar && <Text style={styles.star}>☆</Text>}
      {[...Array(emptyStars)].map((_, i) => (
        <Text key={'es' + i} style={styles.emptyStar}>☆</Text>
      ))}
    </View>
  );
}

type UserData = {
  fullName?: string;
  email?: string;
  phone?: string;
  rating?: number | string;
  isVerified?: boolean;
  acceptedWorksCount?: number;
  postedWorksCount?: number;
};

export default function ViewUserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'User ID not provided');
      router.push('/home/(tabs)');
      return;
    }

    async function fetchUser() {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', id));
        if (userDoc.exists()) {
          const data = userDoc.data();

          // Count acceptedWorks and postedWorks arrays length or 0 if undefined
          const acceptedWorksCount = Array.isArray(data.acceptedWorks)
            ? data.acceptedWorks.length
            : 0;
          const postedWorksCount = Array.isArray(data.postedWorks)
            ? data.postedWorks.length
            : 0;

          setUser({
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            rating: data.rating,
            isVerified: data.isVerified,
            acceptedWorksCount,
            postedWorksCount,
          });
        } else {
          Alert.alert('Not Found', 'User not found');
          router.push('/home/(tabs)');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        Alert.alert('Error', 'Failed to fetch user details');
        router.push('/home/(tabs)');
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.centered, styles.background]}>
        <ActivityIndicator size="large" color="#3a125d" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.centered, styles.background]}>
        <Text style={styles.infoText}>User data not available.</Text>
      </View>
    );
  }

  const {
    fullName,
    email,
    phone,
    rating,
    isVerified = false,
    acceptedWorksCount = 0,
    postedWorksCount = 0,
  } = user;

  const ratingNum = Number(rating) || 0;

  // Calculate skill percentage (accepted / posted)
  const skillPercent =
    postedWorksCount > 0
      ? Math.round((acceptedWorksCount / postedWorksCount) * 100)
      : 0;

  return (
    <ScrollView contentContainerStyle={[styles.container, styles.background]}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{fullName || 'No Name'}</Text>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{email || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{phone || 'N/A'}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Rating:</Text>
          <Stars rating={ratingNum} />
          <Text style={styles.ratingNumber}>{ratingNum.toFixed(1)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Accepted Works: </Text>
          <Text style={styles.value}>{acceptedWorksCount}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Posted Works:</Text>
          <Text style={styles.value}>{postedWorksCount}</Text>
        </View>

        {/* Skill progress bar */}
        <View style={styles.detailRow}>
          <Text style={styles.label}>Skill:</Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[styles.progressBarFill, { width: `${skillPercent}%` }]}
            />
          </View>
          <Text style={styles.skillPercent}>{skillPercent}%</Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/home/(tabs)')}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#f0f2f5',
    flexGrow: 1,
  },
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1877F2',
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifiedText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  label: {
    width: 130,
    fontWeight: '600',
    color: '#606770',
    fontSize: 16,
  },
  value: {
    flex: 1,
    fontSize: 16,
    color: '#050505',
  },
  star: {
    color: '#fbc02d',
    fontSize: 20,
    marginRight: 2,
  },
  emptyStar: {
    color: '#ddd',
    fontSize: 20,
    marginRight: 2,
  },
  ratingNumber: {
    marginLeft: 8,
    fontSize: 16,
    color: '#606770',
  },
  progressBarBackground: {
    flex: 1,
    height: 14,
    backgroundColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1877F2',
  },
  skillPercent: {
    width: 40,
    textAlign: 'right',
    fontWeight: '600',
    color: '#606770',
  },
  backButton: {
    marginTop: 30,
    backgroundColor: '#1877F2',
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#606770',
  },
});
