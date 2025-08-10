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
  getDoc,
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
  workData?: any; // We'll add this dynamically after fetching
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = getAuth().currentUser;
  const router = useRouter();

  // Helper to format Firestore Timestamp safely
  const formatDate = (ts: any) => {
    if (!ts) return 'N/A';
    if (ts.toDate) return ts.toDate().toLocaleString();
    return ts.toString();
  };

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
      async (querySnapshot) => {
        const notifList: Notification[] = [];
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const notif: Notification = {
            id: docSnap.id,
            message: data.message,
            createdAt: data.createdAt,
            read: data.read,
            workId: data.workId,
            workData: null,
          };

          // Fetch the work data for this notification's workId
          if (data.workId) {
            try {
              const workSnap = await getDoc(doc(db, 'worked', data.workId));
              if (workSnap.exists()) {
                notif.workData = workSnap.data();
              } else {
                notif.workData = null;
              }
            } catch (error) {
              console.error('Error fetching work data for notification:', error);
              notif.workData = null;
            }
          }

          notifList.push(notif);
        }
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
      await updateDoc(doc(db, 'notifications', notif.id), {
        read: true,
      });

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
        activeOpacity={0.8}
      >
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.timestamp}>{date.toLocaleString()}</Text>

        {item.workData ? (
          <View style={styles.workDetails}>
            <Text style={styles.workTitle}>{item.workData.jobTitle || 'Untitled Work'}</Text>

            <Text style={styles.label}>Description:</Text>
            <Text style={styles.value}>
              {item.workData.description || 'No description provided.'}
            </Text>

            <Text style={styles.label}>Start Date:</Text>
            <Text style={styles.value}>{formatDate(item.workData.startDate)}</Text>

            <Text style={styles.label}>End Date:</Text>
            <Text style={styles.value}>{formatDate(item.workData.endDate)}</Text>

            <Text style={styles.label}>Location:</Text>
            <Text style={styles.value}>{item.workData.location || 'N/A'}</Text>

            <Text style={styles.label}>Price:</Text>
            <Text style={styles.value}>৳{item.workData.price ?? 'N/A'}</Text>

            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.status, item.workData.status === 'active' ? styles.active : styles.inactive]}>
              {item.workData.status || 'unknown'}
            </Text>

          </View>
        ) : (
          <Text style={styles.noWorkData}>Work details not available</Text>
        )}

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
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
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
    marginBottom: 16,
    elevation: 2,
  },
  message: {
    fontSize: 16,
    color: '#3a125d',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  unread: {
    borderLeftWidth: 5,
    borderLeftColor: '#3a125d',
  },
  read: {
    opacity: 0.6,
  },
  workDetails: {
    marginTop: 8,
    backgroundColor: '#eef1f7',
    borderRadius: 8,
    padding: 12,
  },
  workTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3a125d',
    marginBottom: 6,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3a125d',
    marginTop: 6,
  },
  value: {
    fontSize: 14,
    color: '#544d4d',
    marginTop: 2,
  },
  status: {
    marginTop: 4,
    fontWeight: 'bold',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  active: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  inactive: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  noWorkData: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  acceptBtn: {
    backgroundColor: '#3a125d',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  rejectBtn: {
    backgroundColor: '#999',
    padding: 10,
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
