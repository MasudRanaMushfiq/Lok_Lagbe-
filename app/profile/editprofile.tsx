import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useRouter } from 'expo-router';

export default function EditProfileScreen() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    nid: '',
    bio: '',
  });
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            fullName: data.fullName || '',
            phone: data.phone || '',
            nid: data.nid || '',
            bio: data.bio || '',
          });
          setImage(data.profileImage || null);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        Alert.alert('Error', 'Failed to load user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [currentUser]);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image pick error:', error);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        fullName: formData.fullName,
        phone: formData.phone,
        bio: formData.bio,
        profileImage: image,
      });
      Alert.alert('Success', 'Profile updated!');
      router.replace('/home/(tabs)/profile');
    } catch (err) {
      console.error('Failed to save profile:', err);
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3897f0" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>Edit Profile</Text>

        <TouchableOpacity style={styles.profileImageWrapper} onPress={pickImage} activeOpacity={0.8}>
          {image ? (
            <Image source={{ uri: image }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle" size={110} color="#c7c7c7" />
          )}
          <View style={styles.editImageOverlay}>
            <Ionicons name="camera" size={22} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.form}>
          <InputLabel label="Full Name" />
          <TextInput
            style={styles.input}
            value={formData.fullName}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, fullName: text }))}
            placeholder="Enter full name"
            autoCapitalize="words"
            placeholderTextColor="#999"
          />

          <InputLabel label="Phone" />
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, phone: text }))}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            placeholderTextColor="#999"
          />

          <InputLabel label="NID" />
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={formData.nid}
            editable={false}
            placeholder="NID number"
            keyboardType="numeric"
            placeholderTextColor="#aaa"
          />

          <InputLabel label="Bio" />
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={formData.bio}
            onChangeText={(text) => setFormData((prev) => ({ ...prev, bio: text }))}
            placeholder="Write something about yourself"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const InputLabel = ({ label }: { label: string }) => (
  <Text style={styles.label}>{label}</Text>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    paddingVertical: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#262626',
    marginBottom: 24,
  },
  profileImageWrapper: {
    borderRadius: 70,
    borderWidth: 3,
    borderColor: '#3897f0',
    overflow: 'hidden',
    marginBottom: 24,
    position: 'relative',
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: '#3897f0',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    width: '100%',
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 20,
    elevation: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#262626',
    marginTop: 15,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbdbdb',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#262626',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  bioInput: {
    minHeight: 100,
  },
  saveButton: {
    backgroundColor: '#3897f0',
    marginTop: 30,
    paddingVertical: 14,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#3897f0',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#aaccee',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
