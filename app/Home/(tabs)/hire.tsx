import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const hireOptions = [
  {
    id: '1',
    jobTitle: 'Cleaning Service',
    description: 'Professional cleaning for home or office. Reliable and affordable.',
    price: 1500,
  },
  {
    id: '2',
    jobTitle: 'Plumbing Repair',
    description: 'Fix leaks, blocked drains, and plumbing installations.',
    price: 2500,
  },
  {
    id: '3',
    jobTitle: 'Electrician Services',
    description: 'Electrical wiring, appliance installation, and troubleshooting.',
    price: 3000,
  },
  {
    id: '4',
    jobTitle: 'Painting Service',
    description: 'Interior and exterior painting by experienced professionals.',
    price: 5000,
  },
  {
    id: '5',
    jobTitle: 'Carpentry Work',
    description: 'Custom furniture, repairs, and installations.',
    price: 3500,
  },
  {
    id: '6',
    jobTitle: 'Gardening and Landscaping',
    description: 'Garden maintenance, planting, and landscaping services.',
    price: 2800,
  },
  {
    id: '7',
    jobTitle: 'Moving & Packing',
    description: 'Safe and quick moving service for your belongings.',
    price: 4000,
  },
  {
    id: '8',
    jobTitle: 'Cooking & Catering',
    description: 'Delicious homemade meals and catering for events.',
    price: 2200,
  },
  {
    id: '9',
    jobTitle: 'Babysitting',
    description: 'Experienced babysitters for your children’s care.',
    price: 1800,
  },
  {
    id: '10',
    jobTitle: 'Laundry Service',
    description: 'Quality washing and ironing services with quick turnaround.',
    price: 1200,
  },
];

export default function HireScreen() {
  const handleHireNow = (jobTitle: string) => {
    Alert.alert('Hire Request', `You have chosen to hire for "${jobTitle}".`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Hire for Work</Text>

      {hireOptions.map(({ id, jobTitle, description, price }) => (
        <View key={id} style={styles.card}>
          <Text style={styles.jobTitle}>{jobTitle}</Text>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.price}>Price: ৳{price}</Text>
          <TouchableOpacity
            style={styles.hireButton}
            onPress={() => handleHireNow(jobTitle)}
          >
            <Text style={styles.hireButtonText}>Hire Now</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#eceefc',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#3a125d',
    marginBottom: 20,
    marginTop: 30,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#3a125d',
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3a125d',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#544d4d',
    marginBottom: 12,
    lineHeight: 20,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e89d07',
    marginBottom: 16,
  },
  hireButton: {
    backgroundColor: '#3a125d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  hireButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
