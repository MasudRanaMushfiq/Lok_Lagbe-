import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  ScrollView 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function AcceptNotification() {
  const { id } = useLocalSearchParams<{ id: string }>(); // notification id
  const [work, setWork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [workId, setWorkId] = useState<string | null>(null);
  const [acceptedUser, setAcceptedUser] = useState<any>(null);
  const [ownerUser, setOwnerUser] = useState<any>(null);
  const [acceptedUID, setAcceptedUID] = useState<string | null>(null); // store acceptedBy UID
  const [ownerUID, setOwnerUID] = useState<string | null>(null); // store owner UID
  const router = useRouter();
  const currentUser = getAuth().currentUser;

  // Fetch notification by id
  useEffect(() => {
    if (!id) return;
    const fetchNotification = async () => {
      setLoading(true);
      try {
        const notifSnap = await getDoc(doc(db, 'notifications', id));
        if (notifSnap.exists()) {
          const notifData = notifSnap.data();
          setWorkId(notifData.workId);
        } else {
          Alert.alert('Error', 'Notification not found');
          router.back();
        }
      } catch (err: any) {
        Alert.alert('Error', err.message);
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchNotification();
  }, [id]);

  // Fetch work, accepted user, and owner
  useEffect(() => {
    if (!workId) return;
    const fetchWork = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'worked', workId));
        if (snap.exists()) {
          const workData = snap.data();
          setWork(workData);

          // store owner and accepted IDs
          setOwnerUID(workData.ownerId || workData.userId || null);
          setAcceptedUID(workData.acceptedBy || null);

          // fetch acceptedBy user info if exists
          if (workData.acceptedBy) {
            const userSnap = await getDoc(doc(db, 'users', workData.acceptedBy));
            if (userSnap.exists()) setAcceptedUser(userSnap.data());
          }

          // fetch owner/poster info
          const ownerId = workData.ownerId || workData.userId;
          if (ownerId) {
            const ownerSnap = await getDoc(doc(db, 'users', ownerId));
            if (ownerSnap.exists()) setOwnerUser(ownerSnap.data());
          }
        } else {
          Alert.alert('Error', 'Work not found');
          router.back();
        }
      } catch (err: any) {
        console.error(err);
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchWork();
  }, [workId]);

  // Grant Work
  const grantWork = async () => {
    if (!workId || !acceptedUID) return;
    setLoading(true);
    try {
      // 1. update work status
      await updateDoc(doc(db, 'worked', workId), { status: 'accepted' });

      // 2. send notification to accepted user
      await addDoc(collection(db, 'notifications'), {
        message: `You have been granted the work: ${work.jobTitle}`,
        type: 'accepted',
        workId: workId,
        fromUserId: ownerUID || '', 
        toUserId: acceptedUID,
        createdAt: serverTimestamp(),
        read: false,
      });

      Alert.alert('Success', 'Work granted and user notified.');

      // 3. Route to payment page
      router.push(`/screen/payment?workId=${workId}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reject User
  const rejectUser = async () => {
    if (!workId) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'worked', workId), {
        status: 'active',
        acceptedBy: null,
      });
      Alert.alert('User rejected.');
      router.push('/home');
    } catch (err: any) {
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
        <Text>No work found for this notification.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Work Details Card */}
      <View style={styles.card}>
        <Text style={styles.title}>{work.jobTitle}</Text>
        <Text style={styles.description}>{work.description}</Text>
        <Text>Status: {work.status}</Text>
        <Text>Budget: {work.budget}</Text>
        <Text>Created At: {work.createdAt?.toDate?.()?.toLocaleString?.()}</Text>
      </View>

      {/* Accepted By Section */}
      {acceptedUser && (
        <View style={styles.acceptedRow}>
          <Text>Accepted By: {acceptedUser.name || acceptedUser.fullName}</Text>
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => router.push(`/screen/viewuser?id=${acceptedUID}`)}
          >
            <Text style={styles.linkText}>View User</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Owner Section */}
      {ownerUser && (
        <View style={styles.acceptedRow}>
          <Text>Owner: {ownerUser.name || ownerUser.fullName}</Text>
        </View>
      )}

      {/* Bottom Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.btn, styles.acceptBtn]} onPress={grantWork}>
          <Text style={styles.btnText}>Grant Work</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.rejectBtn]} onPress={rejectUser}>
          <Text style={styles.btnText}>Reject User</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flexGrow: 1, backgroundColor: '#f9f9f9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 16, elevation: 2 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  description: { fontSize: 16, marginBottom: 8 },
  acceptedRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    marginBottom: 16 
  },
  linkBtn: { padding: 8, backgroundColor: '#1877F2', borderRadius: 4 },
  linkText: { color: '#fff', fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 'auto' },
  btn: { flex: 1, padding: 14, borderRadius: 6, marginHorizontal: 6, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#28a745' },
  rejectBtn: { backgroundColor: '#dc3545' },
  btnText: { color: '#fff', fontWeight: '700' },
});
