import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function AcceptedNotification() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [work, setWork] = useState<any>(null);
  const [poster, setPoster] = useState<any>(null);
  const [worker, setWorker] = useState<any>(null);
  const [showPhone, setShowPhone] = useState(false);
  const router = useRouter();
  const currentUser = getAuth().currentUser;

  // Fetch work, poster, and worker data
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const notifSnap = await getDoc(doc(db, 'notifications', id));
        if (!notifSnap.exists()) {
          router.back();
          return;
        }
        const notifData = notifSnap.data();
        const workId = notifData.workId;
        if (!workId) {
          router.back();
          return;
        }

        const workSnap = await getDoc(doc(db, 'worked', workId));
        if (!workSnap.exists()) {
          router.back();
          return;
        }
        const workData = workSnap.data();
        setWork({ id: workSnap.id, ...workData });

        // Fetch poster
        if (workData.userId) {
          const posterSnap = await getDoc(doc(db, 'users', workData.userId));
          if (posterSnap.exists()) setPoster(posterSnap.data());
        }

        // Fetch worker
        if (workData.acceptedBy) {
          const workerSnap = await getDoc(doc(db, 'users', workData.acceptedBy));
          if (workerSnap.exists()) setWorker(workerSnap.data());
        }

      } catch (err) {
        console.error(err);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleContact = () => setShowPhone(true);

  const handleComplete = async () => {
    if (!work || !currentUser) return;
    setLoading(true);
    try {
      // 1. Update work status
      await updateDoc(doc(db, 'worked', work.id), { status: 'completed_sent' });

      // 2. Send notification to poster
      if (work.userId) {
        await addDoc(collection(db, 'notifications'), {
          workId: work.id,
          toUserId: work.userId,          // Poster receives notification
          fromUserId: currentUser.uid,    // Worker sends notification
          message: `The work "${work.jobTitle}" has been completed. Please confirm it.`,
          type: 'completed_sent',
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert('Success', 'Work marked as complete and poster notified!');
      router.push('/home');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

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
      <View style={styles.card}>
        <Text style={styles.title}>{work.jobTitle}</Text>
        <Text style={styles.description}>{work.description}</Text>
        <Text>Start: {work.startDate?.toDate?.()?.toLocaleString?.()}</Text>
        <Text>End: {work.endDate?.toDate?.()?.toLocaleString?.()}</Text>
        <Text>Budget: ৳{work.budget || work.price}</Text>

        {poster && <Text style={styles.posterText}>Posted By: {poster.name || poster.fullName}</Text>}
        {worker && <Text style={styles.workerText}>Worker: {worker.name || worker.fullName}</Text>}

        {showPhone && poster?.phone && (
          <Text style={styles.phoneText}>Poster Phone: {poster.phone}</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.contactBtn]} onPress={handleContact}>
          <Text style={styles.btnText}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.completeBtn]} onPress={handleComplete}>
          <Text style={styles.btnText}>Complete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: '#f9f9f9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, elevation: 2 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  description: { fontSize: 16, marginBottom: 8 },
  posterText: { marginTop: 6, fontWeight: '600' },
  workerText: { marginTop: 4, fontWeight: '600' },
  phoneText: { marginTop: 6, fontSize: 16, color: '#1877F2' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  btn: { flex: 1, padding: 14, borderRadius: 6, marginHorizontal: 6, alignItems: 'center' },
  contactBtn: { backgroundColor: '#1877F2' },
  completeBtn: { backgroundColor: '#28a745' },
  btnText: { color: '#fff', fontWeight: '700' },
});
