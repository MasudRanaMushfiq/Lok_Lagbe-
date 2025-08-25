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
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getAuth } from 'firebase/auth';

type WorkData = {
  jobTitle: string;
  description: string;
  startDate: any;
  endDate: any;
  location: string;
  price: number;
  status: string;
  userId: string;       // Poster
  acceptedBy?: string;  // Worker
};

type UserData = {
  id: string;
  name: string;
  email?: string;
};

export default function NotificationDetailScreen() {
  const { id: notificationId } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [work, setWork] = useState<WorkData | null>(null);
  const [workId, setWorkId] = useState<string | null>(null);
  const [fromUser, setFromUser] = useState<UserData | null>(null);
  const [posterUser, setPosterUser] = useState<UserData | null>(null);
  const [notifId, setNotifId] = useState<string | null>(null);
  const currentUser = getAuth().currentUser;
  const router = useRouter();

  const formatDate = (ts: any) => {
    if (!ts) return 'N/A';
    if (ts.toDate) return ts.toDate().toLocaleString();
    return ts.toString();
  };

  useEffect(() => {
    if (!notificationId || !currentUser) {
      Alert.alert('Error', 'Invalid notification or user not logged in');
      router.back();
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const notifSnap = await getDoc(doc(db, 'notifications', notificationId));
        if (!notifSnap.exists()) {
          Alert.alert('Error', 'Notification not found');
          router.back();
          return;
        }
        const notifData = notifSnap.data();
        setNotifId(notifSnap.id);

        if (!notifData.workId) {
          Alert.alert('Error', 'Work ID not found in notification');
          router.back();
          return;
        }

        setWorkId(notifData.workId);

        const workSnap = await getDoc(doc(db, 'worked', notifData.workId));
        if (!workSnap.exists()) {
          Alert.alert('Error', 'Work data not found');
          router.back();
          return;
        }
        const workData = workSnap.data() as WorkData;
        setWork(workData);

        if (workData.acceptedBy) {
          const workerSnap = await getDoc(doc(db, 'users', workData.acceptedBy));
          if (workerSnap.exists()) {
            const workerData = workerSnap.data();
            setFromUser({
              id: workerSnap.id,
              name: workerData.fullName || workerData.name || 'Unknown User',
              ...workerData,
            });
          }
        }

        if (workData.userId) {
          const posterSnap = await getDoc(doc(db, 'users', workData.userId));
          if (posterSnap.exists()) {
            const posterData = posterSnap.data();
            setPosterUser({
              id: posterSnap.id,
              name: posterData.fullName || posterData.name || 'Unknown User',
              ...posterData,
            });
          }
        }
      } catch (error) {
        console.error('Fetch error:', error);
        Alert.alert('Error', 'Failed to load data');
        router.back();
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [notificationId, currentUser]);

  const updateWorkStatus = async (status: string, notifyWorker: boolean = false) => {
    if (!notifId || !workId || !work) {
      Alert.alert('Error', 'Missing notification or work ID');
      return;
    }
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
      await updateDoc(doc(db, 'worked', workId), { status });

      if (notifyWorker && work.acceptedBy) {
        await addDoc(collection(db, 'notifications'), {
          workId: workId,
          toUserId: work.acceptedBy,
          fromUserId: currentUser?.uid,
          message: 'Your work is accepted, now complete it.',
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert('Success', `Work marked as ${status}`);
      router.push('/home');
    } catch (error) {
      console.error(`Error updating status to ${status}:`, error);
      Alert.alert('Error', `Failed to mark work as ${status}`);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, styles.background]}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  if (!work) {
    return (
      <View style={[styles.centered, styles.background]}>
        <Text style={styles.infoText}>Work data not available.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, styles.background]}>
      <View style={styles.card}>
        <Text style={styles.title}>{work.jobTitle || 'Untitled Work'}</Text>
        <Text style={styles.value}>{work.description}</Text>
        <Text style={styles.value}>Start: {formatDate(work.startDate)}</Text>
        <Text style={styles.value}>End: {formatDate(work.endDate)}</Text>
        <Text style={styles.value}>Location: {work.location}</Text>
        <Text style={styles.value}>Price: ৳{work.price}</Text>
        <Text style={styles.value}>Status: {work.status}</Text>
      </View>

      {work.status === 'completed_sent' ? (
        <View>
          <View style={styles.card}>
            <Text style={styles.label}>Poster: {posterUser?.name || 'Unknown'}</Text>
            <Text style={styles.label}>Worker: {fromUser?.name || 'Unknown'}</Text>
          </View>

          <View style={styles.buttonRow}>
            {/* Confirm → mark completed */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn]}
              onPress={() => updateWorkStatus('completed', false)}
            >
              <Text style={styles.actionBtnText}>Confirm</Text>
            </TouchableOpacity>

            {/* No → mark accepted */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => updateWorkStatus('accepted', false)}
            >
              <Text style={styles.actionBtnText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.userSection}>
            <Text style={styles.tryingText}>Trying to work</Text>
            {fromUser ? (
              <View style={styles.userRow}>
                <Text style={styles.userName}>{fromUser.name}</Text>
                <TouchableOpacity
                  style={styles.viewUserBtn}
                  onPress={() =>
                    router.push({ pathname: '/screen/viewuser', params: { id: fromUser.id } })
                  }
                >
                  <Text style={styles.viewUserBtnText}>View User</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.value}>User info not available</Text>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn]}
              onPress={() => updateWorkStatus('accepted', true)}
            >
              <Text style={styles.actionBtnText}>Give Work</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => updateWorkStatus('active')}
            >
              <Text style={styles.actionBtnText}>Reject User</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: '#f0f2f5', flexGrow: 1, paddingVertical: 20 },
  container: { paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoText: { color: '#606770', fontSize: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10, color: '#1877F2' },
  value: { fontSize: 14, marginBottom: 6, color: '#333' },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 8 },

  userSection: { marginBottom: 20 },
  tryingText: { color: '#8b8d91', fontSize: 12, marginBottom: 4 },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userName: { fontSize: 18, fontWeight: '700' },
  viewUserBtn: { borderColor: '#1877F2', borderWidth: 1, padding: 8, borderRadius: 6 },
  viewUserBtnText: { color: '#1877F2', fontWeight: '600' },

  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', margin: 6 },
  confirmBtn: { backgroundColor: '#1877F2' },
  rejectBtn: { backgroundColor: '#d9534f' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
