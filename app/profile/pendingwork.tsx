import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { getAuth, User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  Timestamp,
} from 'firebase/firestore';
import { useRouter } from 'expo-router';

type WorkData = {
  id: string;
  jobTitle: string;
  category?: string;
  description?: string;
  price?: number;
  location?: string;
  status?: string;
  userId?: string;
  createdAt?: any;
};

export default function AcceptedWorksScreen() {
  const [acceptedWorks, setAcceptedWorks] = useState<WorkData[]>([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const db = getFirestore();
  const router = useRouter();

  const currentUser: User | null = auth.currentUser;

  useEffect(() => {
    const fetchAcceptedWorks = async () => {
      if (!currentUser) {
        router.replace('/auth/login');
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) {
          Alert.alert('Error', 'User data not found');
          return;
        }
        const userData = userDoc.data();
        const acceptedIds: string[] = userData.acceptedWorks || [];

        const works: WorkData[] = (
          await Promise.all(
            acceptedIds.map(async (id) => {
              const docSnap = await getDoc(doc(db, 'worked', id));
              if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                  id: docSnap.id,
                  jobTitle: data.jobTitle,
                  category: data.category,
                  description: data.description,
                  price: data.price,
                  location: data.location,
                  status: data.status,
                  userId: data.userId,
                  createdAt: data.createdAt?.toDate?.() || null,
                };
              }
              return null;
            })
          )
        ).filter(Boolean)
         .filter(work => work?.status === 'accepted') as WorkData[]; // Only keep accepted works

        setAcceptedWorks(works);
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to fetch accepted works');
      } finally {
        setLoading(false);
      }
    };

    fetchAcceptedWorks();
  }, [currentUser]);

  const handleContact = async (posterId?: string) => {
    if (!posterId) {
      Alert.alert('Error', 'Poster not found');
      return;
    }
    try {
      const userSnap = await getDoc(doc(db, 'users', posterId));
      if (userSnap.exists()) {
        const data = userSnap.data();
        Alert.alert('Contact Info', `Phone: ${data.phone || 'Not available'}`);
      } else {
        Alert.alert('Error', 'Poster data not found');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch contact info');
    }
  };

  const handleCompleted = async (work: WorkData) => {
    if (!currentUser || !work.userId) return;

    try {
      await updateDoc(doc(db, 'worked', work.id), { status: 'completed_sent' });

      await addDoc(collection(db, 'notifications'), {
        toUserId: work.userId,
        fromUserId: currentUser.uid,
        workId: work.id,
        message: `Your work "${work.jobTitle}" has been completed by the worker. Please Confirm`,
        createdAt: Timestamp.now(),
        read: false,
      });

      Alert.alert('Request Sent', 'Wait for Confirmation');

      setAcceptedWorks((prev) =>
        prev.map((w) =>
          w.id === work.id ? { ...w, status: 'completed' } : w
        )
      );

      router.replace('/home');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to mark as completed');
    }
  };

  const renderWorkCard = (work: WorkData) => (
    <View key={work.id} style={styles.workCard}>
      <Text style={styles.workTitle}>{work.jobTitle}</Text>
      {work.category && <Text style={styles.workCategory}>{work.category}</Text>}
      <Text style={styles.workDescription} numberOfLines={3}>
        {work.description}
      </Text>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Price:</Text>
        <Text style={styles.detailValue}>৳{work.price ?? 'N/A'}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Location:</Text>
        <Text style={styles.detailValue}>{work.location ?? 'N/A'}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Status:</Text>
        <Text style={[styles.detailValue, styles.completedStatus]}>
          {work.status}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Posted on:</Text>
        <Text style={styles.detailValue}>
          {work.createdAt?.toLocaleDateString() || 'N/A'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() => handleContact(work.userId)}
        >
          <Text style={styles.contactBtnText}>Contact</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.completedBtn}
          onPress={() => handleCompleted(work)}
        >
          <Text style={styles.completedBtnText}>Completed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Your Pending Works</Text>
      {acceptedWorks.length === 0 ? (
        <Text style={styles.noWorksText}>No works is pending now</Text>
      ) : (
        acceptedWorks.map(renderWorkCard)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1877F2',
    marginBottom: 16,
    alignSelf: 'flex-start',
    fontFamily: 'Segoe UI',
  },
  noWorksText: {
    fontSize: 16,
    color: '#606770',
    marginVertical: 20,
    alignSelf: 'center',
  },
  workCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  workTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1c1e21',
    marginBottom: 4,
  },
  workCategory: {
    fontSize: 13,
    color: '#1877F2',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  workDescription: {
    fontSize: 14,
    color: '#4b4f56',
    marginBottom: 10,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#606770',
  },
  detailValue: {
    fontSize: 13,
    color: '#4b4f56',
  },
  completedStatus: {
    color: '#1877F2',
    fontWeight: '700',
  },
  contactBtn: {
    flex: 1,
    backgroundColor: '#3a125d',
    paddingVertical: 10,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  contactBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  completedBtn: {
    flex: 1,
    backgroundColor: '#e89d07',
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
  },
  completedBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
