import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';

export default function WalletScreen() {
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    const fetchWallet = async () => {
      setLoading(true);
      try {
        // Fetch wallet balance from user document
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userSnap.exists()) throw new Error('User not found');
        const userData = userSnap.data();
        setWalletBalance(userData.wallet || 0);

        // Fetch transactions if stored in a subcollection "transactions"
        const transCol = collection(db, 'users', currentUser.uid, 'transactions');
        const transQuery = query(transCol, orderBy('timestamp', 'desc'));
        const transSnap = await getDocs(transQuery);
        const transList: any[] = [];
        transSnap.forEach((doc) => transList.push({ id: doc.id, ...doc.data() }));
        setTransactions(transList);
      } catch (err: any) {
        console.error(err);
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1877F2" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>Wallet Balance</Text>
        <Text style={styles.balance}>৳{walletBalance.toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.header}>Transactions</Text>
        {transactions.length === 0 ? (
          <Text style={styles.noTrans}>No transactions yet.</Text>
        ) : (
          transactions.map((t) => (
            <View key={t.id} style={styles.transaction}>
              <Text style={styles.transText}>{t.type || 'Unknown'}</Text>
              <Text style={styles.transAmount}>৳{t.amount || 0}</Text>
              <Text style={styles.transDate}>
                {t.timestamp?.toDate ? t.timestamp.toDate().toLocaleString() : t.timestamp}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: '#f0f2f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  header: { fontSize: 20, fontWeight: '700', color: '#1877F2', marginBottom: 12 },
  balance: { fontSize: 28, fontWeight: '700', color: '#28a745' },
  noTrans: { color: '#555', fontStyle: 'italic' },
  transaction: {
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
    paddingVertical: 10,
  },
  transText: { fontWeight: '600', color: '#333' },
  transAmount: { fontWeight: '700', color: '#28a745', marginTop: 2 },
  transDate: { fontSize: 12, color: '#777', marginTop: 2 },
});
