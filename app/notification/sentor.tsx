import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function SentorNotification() {
  const { workId } = useLocalSearchParams<{ workId: string }>();
  const [work, setWork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!workId) return;
    const fetchWork = async () => {
      setLoading(true);
      const snap = await getDoc(doc(db, 'worked', workId));
      if (snap.exists()) setWork(snap.data());
      setLoading(false);
    };
    fetchWork();
  }, [workId]);

  const approveWorker = async () => {
    if (!workId) return;
    await updateDoc(doc(db, 'worked', workId), { status: 'active' });
    Alert.alert('Worker Approved');
    router.push('/home');
  };

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Worker Request</Text>
      <Text>Job: {work?.jobTitle}</Text>
      <Text>Status: {work?.status}</Text>

      <TouchableOpacity style={styles.btn} onPress={approveWorker}>
        <Text style={styles.btnText}>Approve Worker</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  btn: { marginTop: 20, padding: 14, backgroundColor: '#28a745', borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: '700' },
});
