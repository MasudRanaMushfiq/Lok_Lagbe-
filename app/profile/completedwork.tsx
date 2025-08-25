import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

const CompletedWorksScreen = () => {
  const [completedWorks, setCompletedWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const db = getFirestore();
  const router = useRouter();

  useEffect(() => {
    const fetchCompletedWorks = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          router.replace('/auth/login');
          return;
        }
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists()) {
          Alert.alert('Error', 'User data not found');
          return;
        }
        const userData = userDoc.data();
        const acceptedIds = userData.acceptedWorks || [];

        const works = await Promise.all(
          acceptedIds.map(async (id: string) => {
            try {
              const docSnap = await getDoc(doc(db, 'worked', id));
              if (docSnap.exists()) {
                const data = docSnap.data();
                // Only include works that are accepted (completed)
                if (data.status === 'completed') {
                  return {
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.() || null,
                  };
                }
              }
              return null;
            } catch (error) {
              console.error(`Error fetching work ${id}:`, error);
              return null;
            }
          })
        );

        setCompletedWorks(works.filter(Boolean));
      } catch (error) {
        console.error('Error fetching completed works:', error);
        Alert.alert('Error', 'Failed to fetch completed works');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedWorks();
  }, []);

  const renderWorkCard = (work: any) => (
    <View key={work.id} style={styles.workCard}>
      <Text style={styles.workTitle}>{work.jobTitle}</Text>
      <Text style={styles.workCategory}>{work.category}</Text>
      <Text style={styles.workDescription} numberOfLines={3} ellipsizeMode="tail">
        {work.description}
      </Text>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Price:</Text>
        <Text style={styles.detailValue}>৳{work.price}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Location:</Text>
        <Text style={styles.detailValue}>{work.location}</Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Status:</Text>
        <Text style={[styles.detailValue, styles.completedStatus]}>
          Completed
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Posted on:</Text>
        <Text style={styles.detailValue}>
          {work.createdAt?.toLocaleDateString() || 'N/A'}
        </Text>
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
      <Text style={styles.sectionTitle}>Your Completed Works</Text>
      {completedWorks.length === 0 ? (
        <Text style={styles.noWorksText}>No completed works found</Text>
      ) : (
        completedWorks.map(renderWorkCard)
      )}
    </ScrollView>
  );
};

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
    color: '#4CAF50',
    fontWeight: '700',
  },
});

export default CompletedWorksScreen;
