import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
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
  type: string; // 👈 added type from firebase
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
            type: data.type, // 👈 store type
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
      <View style={[styles.centered, styles.background]}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={[styles.centered, styles.background]}>
        <Text style={styles.infoText}>Please log in to view notifications.</Text>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={[styles.centered, styles.background]}>
        <Text style={styles.infoText}>No notifications found.</Text>
      </View>
    );
  }

  // 👇 handle routing based on notification type & forward ID
  const handleNotificationPress = (item: Notification) => {
    switch (item.type) {
      case 'general':
        router.push({ pathname: '/notification/general', params: { id: item.id } });
        break;
      case 'accepted':
        router.push({ pathname: '/notification/accepted', params: { id: item.id } });
        break;
      case 'accepted_sent':
        router.push({ pathname: '/notification/acceptedsent', params: { id: item.id } });
        break;
      case 'completed_sent':
        router.push({ pathname: '/notification/completesent', params: { id: item.id } });
        break;
      case 'completed':
        router.push({ pathname: '/notification/completed', params: { id: item.id } });
        break;
      default:
        // fallback route if type not matched
        router.push({ pathname: '/notification/general', params: { id: item.id } });
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const date = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.notificationCard,
          item.read ? styles.read : styles.unread,
        ]}
        onPress={() => handleNotificationPress(item)}
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
      contentContainerStyle={[styles.container, styles.background]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#f0f2f5',
    flex: 1,
  },
  container: {
    padding: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    color: '#606770',
    fontSize: 16,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  unread: {
    borderLeftWidth: 5,
    borderLeftColor: '#1877F2',
  },
  read: {
    opacity: 0.6,
    borderLeftWidth: 5,
    borderLeftColor: '#ccc',
  },
  message: {
    fontSize: 15,
    color: '#1c1e21',
    marginBottom: 6,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#90949c',
  },
});
