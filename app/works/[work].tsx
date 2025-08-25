import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { getAuth } from 'firebase/auth';

export default function WorkDetails() {
  const { work: id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [workData, setWorkData] = useState<any>(null);
  const [posterName, setPosterName] = useState<string>('Loading...');
  const [accepting, setAccepting] = useState(false);

  const currentUser = getAuth().currentUser;

  const formatDate = (ts: Timestamp | string | number | null | undefined) => {
    if (!ts) return 'N/A';
    if (ts instanceof Timestamp) {
      return ts.toDate().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return ts.toString();
  };

  useEffect(() => {
    const fetchWorkAndUser = async () => {
      if (!id) return;

      try {
        const workRef = doc(db, 'worked', id as string);
        const workSnap = await getDoc(workRef);

        if (!workSnap.exists()) {
          Alert.alert('Not Found', 'This work does not exist.');
          setLoading(false);
          return;
        }

        const work = workSnap.data();
        setWorkData(work);

        if (work.userId) {
          const userRef = doc(db, 'users', work.userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const user = userSnap.data();
            setPosterName(user.fullName || 'Unknown User');
          } else {
            setPosterName('Unknown User');
          }
        } else {
          setPosterName('Unknown User');
        }
      } catch (error) {
        console.error('Error fetching work or user:', error);
        Alert.alert('Error', 'Failed to load work details.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkAndUser();
  }, [id]);

  const handleAccept = async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'You must be logged in to accept work.');
      return;
    }

    if (workData.status !== 'active') {
      Alert.alert('Unavailable', 'This work is not available for acceptance.');
      return;
    }

    setAccepting(true);
    try {
      const acceptingUserId = currentUser.uid;
      const workRef = doc(db, 'worked', id as string);
      const userRef = doc(db, 'users', acceptingUserId);

      await updateDoc(workRef, {
        acceptedBy: acceptingUserId,
        acceptedAt: Timestamp.now(),
        status: 'accepted_sent',
      });

      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentAccepted: string[] = userData.acceptedWorks || [];

        if (!currentAccepted.includes(id as string)) {
          await updateDoc(userRef, {
            acceptedWorks: [...currentAccepted, id as string],
          });
        }
      }

      // Add notification and then update it with its own document ID
      if (workData.userId) {
        const notifRef = await addDoc(collection(db, 'notifications'), {
          toUserId: workData.userId,
          fromUserId: acceptingUserId,
          workId: id,
          message: `Will you allow to do "${workData.jobTitle || 'Untitled'}" work done by him?`,
          createdAt: Timestamp.now(),
          read: false,
        });

        // Update the notification doc with its own ID
        await updateDoc(notifRef, { notificationId: notifRef.id });

        console.log('Notification created with ID:', notifRef.id);
      }

      Alert.alert('Success', 'You have applied for this work!');

      // Redirect to home after success
      router.push('/home/(tabs)');
    } catch (error) {
      console.error('Error accepting work:', error);
      Alert.alert('Error', 'Failed to accept the work. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3a125d" />
      </View>
    );
  }

  if (!workData) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#F44336' }}>No data found</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{workData.jobTitle}</Text>
        <Text style={styles.postedBy}>
          Posted by: <Text style={styles.postedByName}>{posterName}</Text>
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionContent}>
            {workData.description || 'No description provided.'}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Start Date</Text>
            <Text style={styles.infoValue}>{formatDate(workData.startDate)}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>End Date</Text>
            <Text style={styles.infoValue}>{formatDate(workData.endDate)}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{workData.location}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Price</Text>
            <Text style={[styles.infoValue, styles.price]}>৳{workData.price}</Text>
          </View>
        </View>

        {workData.status === 'active' ? (
          <TouchableOpacity
            style={[styles.acceptButton, accepting && styles.disabledButton]}
            onPress={handleAccept}
            disabled={accepting}
          >
            <Text style={styles.acceptButtonText}>
              {accepting ? 'Accepting...' : 'Do Work'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              Status: {workData.status.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#eceefc',
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#3a125d',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3a125d',
    marginBottom: 8,
  },
  postedBy: {
    fontSize: 14,
    color: '#636060',
    marginBottom: 20,
  },
  postedByName: {
    fontWeight: '600',
    color: '#e89d07',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3a125d',
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 16,
    color: '#544d4d',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#f5f6fb',
    padding: 16,
    borderRadius: 10,
    marginHorizontal: 5,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3a125d',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    color: '#544d4d',
  },
  price: {
    fontWeight: 'bold',
    color: '#e89d07',
  },
  acceptButton: {
    backgroundColor: '#3a125d',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#7a6999',
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  statusContainer: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  statusText: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
