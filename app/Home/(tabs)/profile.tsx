import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  Image
} from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    nid: ''
  });

  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!currentUser?.uid) {
          router.replace('/login');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFormData({
            fullName: data.fullName || '',
            phone: data.phone || '',
            nid: data.nid || ''
          });
          if (data.profileImage) {
            setImage(data.profileImage);
          }
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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      await updateDoc(doc(db, 'users', currentUser?.uid || ''), {
        profileImage: result.assets[0].uri
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const handleEdit = () => setEditing(true);
  
  const handleSave = async () => {
    try {
      if (!currentUser?.uid) return;
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        fullName: formData.fullName,
        phone: formData.phone,
        nid: formData.nid
      });

      setUserData({ ...userData, ...formData });
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3a125d" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        {editing ? (
          <TouchableOpacity onPress={handleSave}>
            <Ionicons name="checkmark" size={28} color="#3a125d" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleEdit}>
            <Ionicons name="pencil" size={24} color="#3a125d" />
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Picture */}
      <TouchableOpacity 
        style={styles.profileImageContainer}
        onPress={editing ? pickImage : undefined}
        disabled={!editing}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.profileImage} />
        ) : (
          <Ionicons name="person-circle" size={100} color="#3a125d" />
        )}
        {editing && (
          <View style={styles.editImageOverlay}>
            <Ionicons name="camera" size={24} color="white" />
          </View>
        )}
      </TouchableOpacity>

      {/* User Info Card */}
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{currentUser?.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Full Name:</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) => handleChange('fullName', text)}
              placeholder="Enter full name"
            />
          ) : (
            <Text style={styles.value}>{userData?.fullName || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Phone:</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.value}>{userData?.phone || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>NID:</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={formData.nid}
              onChangeText={(text) => handleChange('nid', text)}
              placeholder="Enter NID number"
              keyboardType="numeric"
            />
          ) : (
            <Text style={styles.value}>{userData?.nid || 'Not set'}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Member Since:</Text>
          <Text style={styles.value}>
            {userData?.createdAt?.toDate?.().toLocaleDateString() || 'Unknown'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.historyButton]}
          onPress={() => router.push('/history')}
        >
          <Ionicons name="time" size={20} color="#fff" />
          <Text style={styles.buttonText}>Work History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color="#fff" />
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3a125d',
  },
  profileImageContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3a125d',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3a125d',
  },
  value: {
    fontSize: 16,
    color: '#544d4d',
    maxWidth: '60%',
    textAlign: 'right',
  },
  input: {
    fontSize: 16,
    color: '#544d4d',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 5,
    width: '60%',
    textAlign: 'right',
  },
  buttonContainer: {
    marginTop: 10,
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    elevation: 2,
    gap: 8,
  },
  historyButton: {
    backgroundColor: '#19A7CE',
  },
  logoutButton: {
    backgroundColor: '#e63946',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;