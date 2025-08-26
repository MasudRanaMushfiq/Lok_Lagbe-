import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // ✅ make sure updated firebaseConfig

const LogIn: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); // 👈 state for auth checking

  // ✅ Check if user already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // already logged in -> go to home
        router.replace('/home');
      }
      setCheckingAuth(false); // stop loading
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [key]: value });
    setErrorMsg('');
  };

  const handleSubmit = async () => {
    const { email, password } = formData;

    if (!email.trim() || !password.trim()) {
      setErrorMsg('⚠️ Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setErrorMsg('');
      router.replace('/home');
    } catch (error: any) {
      console.error('Login error:', error.message);
      setErrorMsg('❌ Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#146C94" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Log In</Text>

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={formData.password}
          onChangeText={(text) => handleChange('password', text)}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20 }}>
          <Text style={{ color: 'black', fontSize: 16 }}>
            If you don&apos;t have an account, please
          </Text>
          <Link
            href="/auth/signup"
            style={{
              fontWeight: 'bold',
              color: '#146C94',
              fontSize: 16,
              marginLeft: 4,
            }}
          >
            Register.
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LogIn;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: 'D7D7D7',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#146C94',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#146C94',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#b91c1c',
    marginBottom: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
