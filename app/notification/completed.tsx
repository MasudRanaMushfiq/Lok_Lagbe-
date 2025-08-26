import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, Timestamp } from 'firebase/firestore';

export default function CompletedWork() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [work, setWork] = useState<any>(null);
  const [poster, setPoster] = useState<any>(null);
  const [worker, setWorker] = useState<any>(null);
  const router = useRouter();

  const formatDate = (ts: any) => {
    if (!ts) return 'N/A';
    if (ts instanceof Timestamp) return ts.toDate().toLocaleString();
    if (ts.toDate) return ts.toDate().toLocaleString();
    return ts.toString();
  };

  useEffect(() => {
    if (!id) {
      Alert.alert('Error', 'No notification ID provided');
      router.back();
      return;
    }

    const fetchWork = async () => {
      setLoading(true);
      try {
        // 1. Get notification
        const notifSnap = await getDoc(doc(db, 'notifications', id));
        if (!notifSnap.exists()) throw new Error('Notification not found');

        const notifData = notifSnap.data();
        const workId = notifData.workId;
        if (!workId) throw new Error('Work ID not found in notification');

        // 2. Get work data
        const workSnap = await getDoc(doc(db, 'worked', workId));
        if (!workSnap.exists()) throw new Error('Work not found');
        const workData = { id: workSnap.id, ...workSnap.data() };
        setWork(workData);

        // 3. Get poster
        if (workData.userId) {
          const posterSnap = await getDoc(doc(db, 'users', workData.userId));
          if (posterSnap.exists()) setPoster(posterSnap.data());
        }

        // 4. Get worker
        if (workData.acceptedBy) {
          const workerSnap = await getDoc(doc(db, 'users', workData.acceptedBy));
          if (workerSnap.exists()) setWorker(workerSnap.data());
        }
      } catch (err: any) {
        console.error(err);
        Alert.alert('Error', err.message);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchWork();
  }, [id]);

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
        <Text>No work data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Facebook-style Work Card */}
      <View style={styles.card}>
        <Text style={styles.title}>{work.jobTitle || 'Untitled Work'}</Text>
        <Text style={styles.description}>{work.description || 'No description'}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Budget: </Text>
          <Text style={styles.value}>৳{work.budget || work.price || 0}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Start: </Text>
          <Text style={styles.value}>{formatDate(work.startDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>End: </Text>
          <Text style={styles.value}>{formatDate(work.endDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status: </Text>
          <Text style={styles.value}>{work.status || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Posted By: </Text>
          <Text style={styles.value}>{poster?.fullName || poster?.name || 'Unknown'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Worker: </Text>
          <Text style={styles.value}>{worker?.fullName || worker?.name || 'Not Assigned'}</Text>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.btn, styles.homeBtn]}
          onPress={() => router.push('/home')}
        >
          <Text style={styles.btnText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.walletBtn]}
          onPress={() => router.push('/screen/wallet')}
        >
          <Text style={styles.btnText}>Wallet</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: '#f0f2f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#1877F2', marginBottom: 8 },
  description: { fontSize: 16, color: '#333', marginBottom: 12 },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { fontWeight: '600', color: '#555', width: 100 },
  value: { color: '#000', fontWeight: '400', flexShrink: 1 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  btn: { flex: 1, padding: 14, borderRadius: 8, marginHorizontal: 6, alignItems: 'center' },
  homeBtn: { backgroundColor: '#1877F2' },
  walletBtn: { backgroundColor: '#28a745' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
