import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default function GeneralNotification() {
  const { workId } = useLocalSearchParams<{ workId: string }>();
  const [work, setWork] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>General Notification</Text>
      {work ? (
        <>
          <Text>Job: {work.jobTitle}</Text>
          <Text>Status: {work.status}</Text>
        </>
      ) : (
        <Text>No work data found</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
});
