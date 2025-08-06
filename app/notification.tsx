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
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth } from 'firebase/auth';

type Notification = {
  id: string;
  message: string;
  createdAt: any;
  read: boolean;
  workId: string; // make sure this exists in your notifications
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getAuth().currentUser;

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

  const handleAccept = async (notif: Notification) => {
    try {
      // 1. Update notification as read
      await updateDoc(doc(db, 'notifications', notif.id), {
        read: true,
      });

      // 2. Update work status to "completed"
      if (notif.workId) {
        await updateDoc(doc(db, 'worked', notif.workId), {
          status: 'completed',
        });
        Alert.alert('Success', 'Work marked as completed');
      } else {
        Alert.alert('Error', 'workId not found in notification.');
      }
    } catch (error) {
      console.error('Accept error:', error);
      Alert.alert('Error', 'Failed to accept the work');
    }
  };

  const handleReject = async (notif: Notification) => {
    try {
      await updateDoc(doc(db, 'notifications', notif.id), {
        read: true,
      });
      Alert.alert('Rejected', 'Notification marked as read.');
    } catch (error) {
      console.error('Reject error:', error);
      Alert.alert('Error', 'Failed to reject');
    }
  };

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
    const date = item.createdAt?.toDate
      ? item.createdAt.toDate()
      : new Date();

    return (
      <View
        style={[
          styles.notificationCard,
          item.read ? styles.read : styles.unread,
        ]}
      >
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.timestamp}>{date.toLocaleString()}</Text>

        {!item.read && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => handleAccept(item)}
            >
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => handleReject(item)}
            >
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  acceptBtn: {
    backgroundColor: '#3a125d',
    padding: 8,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  rejectBtn: {
    backgroundColor: '#999',
    padding: 8,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
