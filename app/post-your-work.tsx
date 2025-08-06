import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, doc, setDoc, Timestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
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

  const [jobTitle, setJobTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Check auth state when component mounts
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.replace('/Home/(tabs)'); // Redirect to auth if not logged in
      }
    });
    return unsubscribe;
  }, []);

  const handlePostWork = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to post work.');
      return;
    }

    if (!jobTitle || !description || !price || !location) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    try {
      // Normalize dates to start of day
      const normalizedStartDate = new Date(startDate);
      normalizedStartDate.setHours(0, 0, 0, 0);
      
      const normalizedEndDate = new Date(endDate);
      normalizedEndDate.setHours(0, 0, 0, 0);

      // Create document reference
      const workRef = doc(collection(db, 'worked'));

      // Work data to be saved
      const workData = {
        workId: workRef.id,
        userId: currentUser.uid, // Add user ID who posted the work
        jobTitle: jobTitle.trim(),
        description: description.trim(),
        price: Number(price),
        location: location.trim(),
        category,
        startDate: Timestamp.fromDate(normalizedStartDate),
        endDate: Timestamp.fromDate(normalizedEndDate),
        createdAt: Timestamp.now(),
        status: 'active',
      };

      // Save to worked collection
      await setDoc(workRef, workData);

      // Add to user's subcollection
      const userWorkRef = doc(db, 'users', currentUser.uid, 'postedWorks', workRef.id);
      await setDoc(userWorkRef, {
        workId: workRef.id,
        postedAt: Timestamp.now(),
        status: 'active',
      });

      // Also update user's document with this work reference
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        postedWorks: arrayUnion(workRef.id),
      });

      Alert.alert('Success', 'Work posted successfully!');
      router.replace('/Home/(tabs)'); // Navigate to home page
    } catch (err) {
      console.error('Error posting work:', err);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  return (
    <View style={styles.container}>
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

      <TouchableOpacity style={styles.button} onPress={handlePostWork}>
        <Text style={styles.buttonText}>Post Work</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#eceefc',
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: '#3a125d',
    marginVertical: 20,
    marginLeft: 10,
    marginTop: 50,
  },
  input: {
    height: 48,
    borderColor: '#3a125d',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 12,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    color: '#544d4d',
    justifyContent: 'center',
  },
  dateText: {
    color: '#544d4d',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#3a125d',
    paddingVertical: 14,
    marginHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
});