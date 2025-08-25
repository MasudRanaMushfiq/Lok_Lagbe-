import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'expo-router';

const DashboardScreen = () => {
  const [loading, setLoading] = useState(true);
  const [postedCount, setPostedCount] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [complaintsCount, setComplaintsCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [profileRating, setProfileRating] = useState(0);

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

        // Pending works
        const pendingQuery = query(
          collection(db, 'worked'),
          where('acceptedBy', '==', uid),
          where('status', 'in', ['accepted', 'completed_sent'])
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        setPendingCount(pendingSnapshot.size);

        // Completed works
        const completedQuery = query(
          collection(db, 'worked'),
          where('acceptedBy', '==', uid),
          where('status', '==', 'completed')
        );
        const completedSnapshot = await getDocs(completedQuery);
        setCompletedCount(completedSnapshot.size);

        // Complaints
        const complaintsQuery = query(
          collection(db, 'complaints'),
          where('userId', '==', uid)
        );
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

  const ButtonCard = ({ title, onPress }: { title: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.buttonCard} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Dashboard</Text>

      {/* Mini dashboard row */}
      <View style={styles.miniRow}>
        <View style={[styles.miniCard, { backgroundColor: '#3a125d' }]}>
          <Text style={styles.miniCardCount}>{postedCount}</Text>
          <Text style={styles.miniCardTitle}>Posted</Text>
        </View>
        <View style={[styles.miniCard, { backgroundColor: '#1877F2' }]}>
          <Text style={styles.miniCardCount}>{acceptedCount}</Text>
          <Text style={styles.miniCardTitle}>Accepted</Text>
        </View>
        <View style={[styles.miniCard, { backgroundColor: '#e89d07' }]}>
          <Text style={styles.miniCardCount}>{pendingCount}</Text>
          <Text style={styles.miniCardTitle}>Pending</Text>
        </View>
        <View style={[styles.miniCard, { backgroundColor: '#4caf50' }]}>
          <Text style={styles.miniCardCount}>{completedCount}</Text>
          <Text style={styles.miniCardTitle}>Completed</Text>
        </View>
        <View style={[styles.miniCard, { backgroundColor: '#f44336' }]}>
          <Text style={styles.miniCardCount}>{complaintsCount}</Text>
          <Text style={styles.miniCardTitle}>Complaints</Text>
        </View>
      </View>

      {/* Buttons for navigation */}
      <View style={styles.buttonsSection}>
        <ButtonCard title="Your Posted Works" onPress={() => router.push('/profile/postedwork')} />
        <ButtonCard title="Requesting Works" onPress={() => router.push('/profile/acceptedwork')} />
        <ButtonCard title="Pending Works" onPress={() => router.push('/profile/pendingwork')} />
        <ButtonCard title="Completed Works" onPress={() => router.push('/profile/completedwork')} />
        <ButtonCard title="View Complaints" onPress={() => router.push('/profile/pendingwork')} />
      </View>

      {/* Profile rating */}
      <View style={styles.ratingSection}>
        <Text style={styles.ratingText}>Profile Rating: {profileRating.toFixed(1)} ★</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f0f2f5',
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
  },
  miniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  miniCard: {
    flexBasis: '18%',
    marginHorizontal: 2,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  miniCardCount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  miniCardTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    marginTop: 6,
    textAlign: 'center',
  },
  buttonsSection: {
    marginBottom: 30,
  },
  buttonCard: {
    backgroundColor: '#1877F2',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 12,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  ratingSection: {
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1e21',
  },
});

export default DashboardScreen;
