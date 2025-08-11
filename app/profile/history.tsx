import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'expo-router';

const DashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [postedCount, setPostedCount] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [profileRating, setProfileRating] = useState(0);
  const [complaintsCount, setComplaintsCount] = useState(0);

  const auth = getAuth();
  const db = getFirestore();
  const router = useRouter();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          router.replace('/auth/login');
          return;
        }
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists()) {
          alert('User data not found');
          return;
        }
        const userData = userDoc.data();

        setPostedCount(userData.postedWorks?.length || 0);
        setAcceptedCount(userData.acceptedWorks?.length || 0);
        setProfileRating(userData.rating ?? 0);

        const complaintsQuery = query(collection(db, 'complaints'), where('userId', '==', uid));
        const complaintsSnapshot = await getDocs(complaintsQuery);
        setComplaintsCount(complaintsSnapshot.size);
      } catch (error) {
        console.error(error);
        alert('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  const Card = ({ title, value, onPress }: { title: string; value: number | string; onPress?: () => void }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Dashboard</Text>

      <Card
        title="Total Posted Works"
        value={postedCount}
        onPress={() => router.push('/profile/postedwork')}
      />
      <Card
        title="Total Accepted Works"
        value={acceptedCount}
        onPress={() => router.push('/profile/acceptedwork')}
      />
      <Card title="Profile Rating" value={`${profileRating.toFixed(1)} ★`} />
      <Card title="Total Complaints" value={complaintsCount} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  header: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1877F2',
    marginBottom: 20,
    fontFamily: 'Segoe UI',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#606770',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1e21',
  },
});

export default DashboardScreen;
