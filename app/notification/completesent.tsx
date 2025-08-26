import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function AcceptedSentNotification() {
  const { id } = useLocalSearchParams<{ id: string }>(); // notification ID
  const [loading, setLoading] = useState(true);
  const [work, setWork] = useState<any>(null);
  const [poster, setPoster] = useState<any>(null);
  const router = useRouter();
  const currentUser = getAuth().currentUser;

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Get notification
        const notifSnap = await getDoc(doc(db, 'notifications', id));
        if (!notifSnap.exists()) {
          Alert.alert('Error', 'Notification not found');
          router.back();
          return;
        }
        const notifData = notifSnap.data();
        const workId = notifData.workId;
        if (!workId) {
          Alert.alert('Error', 'Work ID not found');
          router.back();
          return;
        }

        // 2. Get work data
        const workSnap = await getDoc(doc(db, 'worked', workId));
        if (!workSnap.exists()) {
          Alert.alert('Error', 'Work data not found');
          router.back();
          return;
        }
        const workData = workSnap.data();
        setWork({ id: workSnap.id, ...workData });

        // 3. Get poster info
        if (workData.userId) {
          const userSnap = await getDoc(doc(db, 'users', workData.userId));
          if (userSnap.exists()) setPoster(userSnap.data());
        }
      } catch (err: any) {
        console.error(err);
        Alert.alert('Error', err.message);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const completeWork = async () => {
    if (!work) return;
    setLoading(true);
    try {
      // 1. Update work status to completed
      await updateDoc(doc(db, 'worked', work.id), { status: 'completed' });

      // 2. Notify the worker (acceptedBy)
      if (work.acceptedBy) {
        await addDoc(collection(db, 'notifications'), {
          workId: work.id,
          toUserId: work.acceptedBy, // send to worker
          fromUserId: currentUser?.uid || null, // poster
          message: `Thank you for completing "${work.jobTitle}". Please collect your payment.`,
          type: 'completed',
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert('Success', 'Work marked as completed. Thanked to worker!');

      // 3. Push to rating page, passing acceptedBy as ratedUserId
      router.push({
        pathname: '/screen/rating',
        params: { workId: work.id, ratedUserId: work.acceptedBy },
      });
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const rejectWork = async () => {
    if (!work) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'worked', work.id), { status: 'accepted' });
      Alert.alert('Work rejected');
      router.push('/home');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  if (!work) {
    return (
      <View style={styles.centered}>
        <Text>No work data available</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{work.jobTitle}</Text>
        <Text>Description: {work.description}</Text>
        <Text>Start: {work.startDate?.toDate?.()?.toLocaleString?.()}</Text>
        <Text>End: {work.endDate?.toDate?.()?.toLocaleString?.()}</Text>
        <Text>Budget: ৳{work.price || work.budget}</Text>
        <Text>Poster: {poster?.fullName || poster?.name || 'Unknown'}</Text>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.btn, styles.confirm]} onPress={completeWork}>
          <Text style={styles.btnText}>Complete</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.reject]} onPress={rejectWork}>
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, elevation: 2 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  btnRow: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { flex: 1, padding: 14, borderRadius: 6, marginHorizontal: 5, alignItems: 'center' },
  confirm: { backgroundColor: '#1877F2' },
  reject: { backgroundColor: '#d9534f' },
  btnText: { color: '#fff', fontWeight: '700' },
});
