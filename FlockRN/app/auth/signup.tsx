import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useColorScheme,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '@/firebase/firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import React, { useState } from 'react';
import { router } from 'expo-router';
import { FirestoreCollections } from '@/schema/firebaseCollections';
import { FirebaseError } from 'firebase/app';
import { Colors } from 'react-native/Libraries/NewAppScreen';

export default function SignUpScreen() {
  const theme = useColorScheme() ?? 'light';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State variable to track password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      await updateProfile(user, {
        displayName: `${firstName || ''} ${lastName || ''}`.trim(),
      });
      await setDoc(doc(db, FirestoreCollections.USERS, user.uid), {
        id: user.uid,
        displayName: user.displayName,
        firstName,
        lastName,
        email: user.email,
        createdAt: new Date(),
      });
      console.log('User created:', user);
      Alert.alert('Success', 'Account created successfully!');
      router.replace('/(tabs)');
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        console.error('Error creating account:', error.message);
        Alert.alert(
          'Sign-Up Error',
          error.message || 'Failed to create an account.',
        );
      } else {
        console.error('Unknown sign up error occurred:', error);
        Alert.alert('Sign-Up Error', 'An unknown error occurred.');
      }
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
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Last name"
        placeholderTextColor="#C6C6C8"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
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
      <View style={styles.passwordContainer}>
        <TextInput
          style={{ ...styles.input, flex: 1 }}
          placeholder="Enter your password"
          placeholderTextColor="#C6C6C8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <MaterialCommunityIcons
          name={showPassword ? 'eye-off' : 'eye'}
          size={24}
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          style={styles.icon}
          onPress={() => setShowPassword(!showPassword)}
        />
      </View>
      <View style={styles.passwordContainer}>
        <TextInput
          style={{ ...styles.input, flex: 1 }}
          placeholder="Confirm your password"
          placeholderTextColor="#C6C6C8"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
        />
        <MaterialCommunityIcons
          name={showConfirmPassword ? 'eye-off' : 'eye'}
          size={24}
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          style={styles.icon}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        />
      </View>

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
  icon: {
    marginLeft: 10,
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
  passwordContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  title: {
    color: '#000',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
});
