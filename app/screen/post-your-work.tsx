import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, doc, setDoc, Timestamp, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { onAuthStateChanged } from 'firebase/auth';

const categories = [
  'Cleaning', 'Plumbing', 'Electrician', 'Carpentry', 'Painting',
  'Gardening', 'Moving', 'Cooking', 'Babysitting', 'Laundry',
  'AC Repair', 'Pest Control', 'Beauty', 'Car Wash', 'Computer Repair',
  'Mobile Repair', 'Tutoring', 'Photography', 'Event Planning', 'Security', 'Other',
];

export default function PostWorkScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userVerified, setUserVerified] = useState<boolean>(false);

  const [jobTitle, setJobTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Fetch user verification status
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserVerified(!!userData.verified);
        }
      } else {
        router.replace('/home/(tabs)');
      }
    });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePostWork = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to post work.');
      return;
    }

    if (!userVerified) {
      Alert.alert('Verification Required', 'You need to be a verified user to post work.');
      return;
    }

    if (!jobTitle.trim() || !description.trim() || !price.trim() || !location.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setUploading(true);
    try {
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);

      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(0, 0, 0, 0);

      const workRef = doc(collection(db, 'worked'));

      const workData = {
        workId: workRef.id,
        userId: currentUser.uid,
        jobTitle: jobTitle.trim(),
        description: description.trim(),
        price: Number(price),
        location: location.trim(),
        category,
        startDate: Timestamp.fromDate(normalizedStartDate),
        endDate: Timestamp.fromDate(normalizedEndDate),
        createdAt: Timestamp.now(),
        status: 'active',
        images: [],
      };

      await setDoc(workRef, workData);

      const userWorkRef = doc(db, 'users', currentUser.uid, 'postedWorks', workRef.id);
      await setDoc(userWorkRef, {
        workId: workRef.id,
        postedAt: Timestamp.now(),
        status: 'active',
      });

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        postedWorks: arrayUnion(workRef.id),
      });

      Alert.alert('Success', 'Work posted successfully!');
      router.replace('/home/(tabs)');
    } catch (err) {
      console.error('Error posting work:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Post Your Work</Text>

      <TextInput
        placeholder="Job Title"
        placeholderTextColor="#636060"
        value={jobTitle}
        onChangeText={setJobTitle}
        style={styles.input}
      />

      <TextInput
        placeholder="Description"
        placeholderTextColor="#636060"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
      />

      <TextInput
        placeholder="Price Offered"
        placeholderTextColor="#636060"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
        style={styles.input}
      />

      <TextInput
        placeholder="Location"
        placeholderTextColor="#636060"
        value={location}
        onChangeText={setLocation}
        style={styles.input}
      />

      {/* Start Date Picker */}
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowStartDatePicker(true)}
      >
        <Text style={styles.dateText}>Start Date: {startDate.toDateString()}</Text>
      </TouchableOpacity>

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
          minimumDate={new Date()}
        />
      )}

      {/* End Date Picker */}
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowEndDatePicker(true)}
      >
        <Text style={styles.dateText}>End Date: {endDate.toDateString()}</Text>
      </TouchableOpacity>

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
          minimumDate={startDate}
        />
      )}

      {/* Category Picker */}
      <View style={[styles.input, { paddingHorizontal: 0, justifyContent: 'center' }]}>
        <Picker
          selectedValue={category}
          onValueChange={(itemValue) => setCategory(itemValue)}
          style={{ color: '#544d4d' }}
          dropdownIconColor="#3a125d"
        >
          {categories.map((cat) => (
            <Picker.Item label={cat} value={cat} key={cat} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity
        style={[styles.button, uploading && { backgroundColor: '#999' }]}
        onPress={handlePostWork}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {uploading ? 'Posting...' : 'Post Work'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    backgroundColor: '#eceefc',
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: '#3a125d',
    marginVertical: 10,
    marginLeft: 30,
  },
  input: {
    height: 48,
    borderColor: '#3a125d',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 12,
    marginHorizontal: 30,
    backgroundColor: '#fff',
    color: '#544d4d',
    justifyContent: 'center',
  },
  dateText: {
    color: '#544d4d',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#0184ffff',
    paddingVertical: 14,
    marginHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
});
