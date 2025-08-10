import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';

type Notification = {
  id: string;
  message: string;
  createdAt: any;
  read: boolean;
  workId: string;
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getAuth().currentUser;
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'notifications');

    const q = query(
      notificationsRef,
      where('toUserId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notifList: Notification[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          notifList.push({
            id: doc.id,
            message: data.message,
            createdAt: data.createdAt,
            read: data.read,
            workId: data.workId,
          });
        });
        setNotifications(notifList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3a125d" />
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.centered}>
        <Text>Please log in to view notifications.</Text>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No notifications found.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Notification }) => {
    const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          item.read ? styles.read : styles.unread,
        ]}
        onPress={() => {
          if (item.workId) {
            router.push({ pathname: '/notification/[id]', params: { id: item.workId } });
          } else {
            Alert.alert('No Work ID', 'This notification is not linked to any work.');
          }
        }}
      >
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.timestamp}>{date.toLocaleString()}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  message: {
    fontSize: 16,
    color: '#3a125d',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: '#3a125d',
  },
  read: {
    opacity: 0.6,
  },
});
