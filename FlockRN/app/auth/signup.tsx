import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { auth } from '@/firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      console.log('User created:', user);
      Alert.alert('Success', 'Account created successfully!');
      // You can navigate to a different screen here, e.g., router.replace("/home");
    } catch (error) {
      console.error('Error creating account:', error.message);
      Alert.alert(
        'Sign-Up Error',
        error.message || 'Failed to create an account.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an Account</Text>

      <TextInput
        style={styles.input}
        placeholder="First name"
        placeholderTextColor="#C6C6C8"
        value={firstName}
        onChangeText={setFirstName}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Last name"
        placeholderTextColor="#C6C6C8"
        value={lastName}
        onChangeText={setLastName}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#C6C6C8"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        placeholderTextColor="#C6C6C8"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm your password"
        placeholderTextColor="#C6C6C8"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#007aff',
    borderRadius: 10,
    padding: 15,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  container: {
    alignItems: 'center',
    backgroundColor: '#f1eee0',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderColor: '#C6C6C8',
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
    padding: 10,
    width: '100%',
  },
  title: {
    color: '#000',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
});
