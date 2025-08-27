import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function GeneralNotification() {
  const { workId } = useLocalSearchParams<{ workId: string }>();
  const [work, setWork] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workId) {
      setLoading(false);
      return;
    }

    const fetchWork = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'worked', workId));
        if (snap.exists()) {
          setWork(snap.data());
        } else {
          setWork(null);
        }
      } catch (err: any) {
        console.error('Error fetching work:', err.message);
        setWork(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWork();
  }, [workId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  if (!work) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>No work data found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Work Details</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Job Title:</Text>
        <Text style={styles.value}>{work.jobTitle || 'N/A'}</Text>

        <Text style={styles.label}>Description:</Text>
        <Text style={styles.value}>{work.description || 'N/A'}</Text>

        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{work.status || 'N/A'}</Text>

        <Text style={styles.label}>Budget:</Text>
        <Text style={styles.value}>{work.budget || 'N/A'}</Text>

        <Text style={styles.label}>Created At:</Text>
        <Text style={styles.value}>
          {work.createdAt?.toDate?.()?.toLocaleString?.() || 'N/A'}
        </Text>

        <Text style={styles.label}>Owner:</Text>
        <Text style={styles.value}>{work.ownerName || 'N/A'}</Text>

        <Text style={styles.label}>Accepted By:</Text>
        <Text style={styles.value}>{work.acceptedByName || 'N/A'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
    backgroundColor: '#f0f2f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  infoText: {
    fontSize: 16,
    color: '#606770',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    color: '#333',
  },
  value: {
    fontSize: 16,
    marginTop: 2,
    color: '#555',
  },
});
