import { TextInput, StyleSheet, Alert, useColorScheme } from 'react-native';
import { Timestamp } from '@react-native-firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { router } from 'expo-router';
import { FirestoreCollections } from '@/schema/firebaseCollections';
import { FirebaseError } from 'firebase/app';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import Button from '@/components/Button';
import { UserProfile } from '@/types/firebase';
import { useFirestore } from '@/firebase/useFirestore';

export default function SignUpScreen() {
  const { flockDb, auth } = useFirestore();
  const theme = useColorScheme() ?? 'light';
  const [userName, setUserName] = useState('');
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
      const userCredential = await auth.createUserWithEmailAndPassword(
        email,
        password,
      );
      const user = userCredential.user;
      await user.updateProfile({
        displayName: `${firstName || ''} ${lastName || ''}`.trim(),
      });

      const userRef = flockDb
        .collection(FirestoreCollections.USERS)
        .doc(user.uid);
      await userRef.set({
        id: user.uid,
        username: userName,
        displayName: user.displayName,
        firstName,
        lastName,
        email: user.email,
        friends: [],
        groups: [],
        createdAt: Timestamp.now(),
        // used for searching
        normalizedUsername: userName.toLowerCase(),
        normalizedFirstName: firstName.toLowerCase(),
        normalizedLastName: lastName.toLowerCase(),
      } as UserProfile);
      Alert.alert('Success', 'Account created successfully!');
      router.replace('/(tabs)/(prayers)');
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
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Create an Account</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="User name"
        placeholderTextColor="#C6C6C8"
        value={userName}
        onChangeText={setUserName}
      />
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
      <ThemedView style={styles.passwordContainer}>
        <TextInput
          style={styles.inputWithIcon}
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
      </ThemedView>
      <ThemedView style={styles.passwordContainer}>
        <TextInput
          style={styles.inputWithIcon}
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
      </ThemedView>

      <Button label="Sign Up" onPress={handleSignUp} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    marginLeft: 10,
  },
  input: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
    padding: 10,
    width: '100%',
  },
  inputWithIcon: {},
  passwordContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  title: {
    color: Colors.black,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
});
styles.inputWithIcon = {
  ...StyleSheet.flatten(styles.input),
  flex: 1,
};
