import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../../firebaseConfig';

const ProfileScreen = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Set your admin UID here
  const ADMIN_UID = "rccEl7PQ48Y4lZtQpv4lj3lea8i2";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!currentUser?.uid) {
          router.replace('/auth/login');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleEdit = () => {
    router.push('/profile/editprofile');
  };

  const handleAdmin = () => {
    router.push('/admin/dashboard');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#262626" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileImageWrapper} activeOpacity={0.8}>
          <Ionicons name="person-circle" size={130} color="#c7c7c7" />
        </TouchableOpacity>

        <Text style={styles.userName}>
          {userData?.fullName || 'No Name'}
        </Text>

        {userData?.bio?.trim() ? (
          <Text style={styles.userBio}>{userData.bio}</Text>
        ) : null}

        <TouchableOpacity style={styles.editButton} onPress={handleEdit} activeOpacity={0.7}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <InfoCard label="Email" value={currentUser?.email || 'Not set'} />
        <InfoCard label="Phone" value={userData?.phone || 'Not set'} />
        <InfoCard label="NID" value={userData?.nid || 'Not set'} />
        <InfoCard label="Member Since" value={userData?.createdAt?.toDate?.().toLocaleDateString() || 'Unknown'} />
        <InfoCard
          label="Rating"
          value={
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={18} color="#f1c40f" />
              <Text style={styles.ratingText}>{userData?.rating ?? 1}</Text>
            </View>
          }
        />
        <InfoCard
          label="Verified"
          value={
            <View style={styles.verifiedContainer}>
              {userData?.verified ? (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#3897f0" />
                  <Text style={[styles.verifiedText, { color: '#3897f0' }]}>Verified</Text>
                </>
              ) : (
                <>
                  <Ionicons name="close-circle" size={18} color="#bbb" />
                  <Text style={[styles.verifiedText, { color: '#bbb' }]}>Not Verified</Text>
                </>
              )}
            </View>
          }
        />
      </View>

      {/* Buttons Row */}
      <View style={styles.buttonsRow}>
        <OutlineButton
          text="Work History"
          onPress={() => router.push('/profile/history')}
        />
        <OutlineButton
          text="Logout"
          onPress={handleLogout}
          textColor="#ed4956"
          borderColor="#ed4956"
        />
      </View>

      {/* Admin Button */}
      {currentUser?.uid === ADMIN_UID && (
        <TouchableOpacity
          style={styles.adminButton}
          onPress={handleAdmin}
          activeOpacity={0.8}
        >
          <Text style={styles.adminButtonText}>Admin Panel</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const InfoCard = ({ label, value }: { label: string; value: any }) => (
  <View style={styles.infoCard}>
    <Text style={styles.infoLabel}>{label}</Text>
    {typeof value === 'string' ? (
      <Text style={styles.infoValue}>{value}</Text>
    ) : (
      value
    )}
  </View>
);

const OutlineButton = ({
  text,
  onPress,
  textColor = '#262626',
  borderColor = '#dbdbdb',
}: {
  text: string;
  onPress: () => void;
  textColor?: string;
  borderColor?: string;
}) => (
  <TouchableOpacity
    style={[styles.outlineButton, { borderColor }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.outlineButtonText, { color: textColor }]}>{text}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 20,
    width: '100%',
  },
  profileImageWrapper: {
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#3897f0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 6,
  },
  userBio: {
    fontSize: 14,
    color: '#8e8e8e',
    marginBottom: 14,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#dbdbdb',
    paddingHorizontal: 40,
    paddingVertical: 8,
    borderRadius: 22,
  },
  editButtonText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#262626',
  },
  infoSection: {
    width: '100%',
    marginBottom: 28,
  },
  infoCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#efefef',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#262626',
    fontSize: 15,
  },
  infoValue: {
    color: '#999',
    fontSize: 15,
    maxWidth: '65%',
    textAlign: 'right',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 15,
    color: '#999',
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 15,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 10,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  outlineButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  adminButton: {
    width: '100%',
    backgroundColor: '#3897f0',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 2,
  },
  adminButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default ProfileScreen;
