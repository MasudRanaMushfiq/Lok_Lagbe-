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
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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
  acceptedBy?: string;
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

        if (notifData.fromUserId) {
          const fromUserSnap = await getDoc(doc(db, 'users', notifData.fromUserId));
          if (fromUserSnap.exists()) {
            const fromUserData = fromUserSnap.data();
            setFromUser({
              id: fromUserSnap.id,
              name:
                fromUserData.fullName ||
                fromUserData.name ||
                fromUserData.displayName ||
                'Unknown User',
              ...fromUserData,
            });
          } else {
            setFromUser(null);
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

  const updateWorkStatus = async (status: string) => {
    if (!notifId || !workId) {
      Alert.alert('Error', 'Missing notification or work ID');
      return;
    }
    try {
      await updateDoc(doc(db, 'notifications', notifId), {
        read: true,
      });

      await updateDoc(doc(db, 'worked', workId), {
        status: status,
      });

      Alert.alert('Success', `Work marked as ${status}`);

      // If completed, navigate to rating page to rate the fromUser
      if (status === 'completed' && fromUser?.id) {
        router.push({
          pathname: '/screen/rating',
          params: { ratedUserId: fromUser.id },
        });
      } else {
        router.back();
      }
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
      {/* Card Container */}
      <View style={styles.card}>
        <Text style={styles.title}>{work.jobTitle || 'Untitled Work'}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Description:</Text>
          <Text style={styles.value}>{work.description || 'No description provided.'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Start Date:</Text>
          <Text style={styles.value}>{formatDate(work.startDate)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>End Date:</Text>
          <Text style={styles.value}>{formatDate(work.endDate)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{work.location || 'N/A'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Price:</Text>
          <Text style={styles.value}>৳{work.price ?? 'N/A'}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text
            style={[
              styles.status,
              work.status === 'active' ? styles.active : styles.inactive,
            ]}
          >
            {work.status || 'unknown'}
          </Text>
        </View>
      </View>

      {/* User Section */}
      <View style={styles.userSection}>
        <Text style={styles.tryingText}>Trying to work</Text>
        {fromUser ? (
          <View style={styles.userRow}>
            <Text style={styles.userName}>{fromUser.name || 'Unknown User'}</Text>
            <TouchableOpacity
              style={styles.viewUserBtn}
              onPress={() => {
                router.push({
                  pathname: '/screen/viewuser',
                  params: { id: fromUser.id },
                });
              }}
            >
              <Text style={styles.viewUserBtnText}>View User</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.value}>User info not available</Text>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.lightBtn]}
          onPress={() => updateWorkStatus('completed')}
        >
          <Text style={[styles.actionBtnText, styles.lightBtnText]}>Mark as Completed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.lightBtn]}
          onPress={() => updateWorkStatus('rejected')}
        >
          <Text style={[styles.actionBtnText, styles.lightBtnText]}>Mark as Rejected</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#f0f2f5',
    flexGrow: 1,
    paddingVertical: 20,
  },
  container: {
    paddingHorizontal: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  infoText: {
    color: '#606770',
    fontSize: 16,
  },

  // Card styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1877F2',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  label: {
    width: 130,
    fontWeight: '700',
    color: '#1877F2',
    fontSize: 14,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#1c1e21',
  },
  status: {
    fontWeight: '700',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 14,
    fontSize: 14,
    alignSelf: 'flex-start',
    color: '#fff',
  },
  active: {
    backgroundColor: '#3a125d',
  },
  inactive: {
    backgroundColor: '#d9534f',
  },
  userSection: {
    marginBottom: 10,
  },
  tryingText: {
    color: '#8b8d91',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3a125d',
  },
  viewUserBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3a125d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  viewUserBtnText: {
    color: '#3a125d',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  lightBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3a125d',
  },
  actionBtnText: {
    fontWeight: '700',
    fontSize: 16,
  },
  lightBtnText: {
    color: '#3a125d',
  },
});
