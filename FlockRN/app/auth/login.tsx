import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Colors } from '@/constants/Colors';
import { doc, getDoc, updateDoc } from '@react-native-firebase/firestore';
import { FirestoreCollections } from '@/schema/firebaseCollections';
import useUserContext from '@/hooks/useUserContext';
import { UserIntroFlow } from '@/types/UserFlags';
import { auth, db } from '@/firebase/firebaseConfig';
import { FirebaseFirestoreError } from '@/types/firebaseErrors';

export default function LoginScreen() {
  const router = useRouter();
  const { updateUserIntroFlowFlagState } = useUserContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const user = await logIn(email, password);
      const userRef = doc(db, FirestoreCollections.USERS, user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        await updateDoc(userRef, {
          friends: userData?.friends || [],
          groups: userData?.groups || [],
          normalizedUsername: userData?.username?.toLowerCase() || '',
          normalizedFirstName: userData?.firstName?.toLowerCase() || '',
          normalizedLastName: userData?.lastName?.toLowerCase() || '',
        });
      } else {
        console.warn('User document does not exist.');
      }
      // Navigate to another screen after successful login
      updateUserIntroFlowFlagState(UserIntroFlow.hasIntroDisclosures, true);
      router.replace('/(tabs)/(prayers)');
    } catch (error) {
      const firebaseError = error as FirebaseFirestoreError;
      console.error('Login error:', firebaseError.message);
    }
  };

  return (
    <SafeAreaView style={styles.loginPage}>
      {/* Heading Section */}
      <View style={styles.headingFrame}>
        <Text style={styles.welcome}>Welcome</Text>
        <Text style={styles.missionText}>
          We're on a mission to help people pray more.
        </Text>
      </View>

      {/* Main Section */}
      <View style={styles.mainSection}>
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginText}>Login with Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginText}>Login with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginText}>Login with Facebook</Text>
          </TouchableOpacity>
        </View>

        {/* Email Login */}
        <View style={styles.emailLogin}>
          <View style={styles.frame}>
            <View style={styles.line} />
            <Text style={styles.orLoginText}>or log in with email</Text>
            <View style={styles.line} />
          </View>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your email"
            placeholderTextColor="#C6C6C8"
            onChangeText={(email) => setEmail(email.toLowerCase())}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your password"
            placeholderTextColor="#C6C6C8"
            secureTextEntry
            onChangeText={(password) => setPassword(password)}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleLogin}>
            <Text style={styles.submitText}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* Signup Section */}
        <Text style={styles.signupText}>
          Don't have an account?{' '}
          <Link href="/auth/signup" style={styles.signupLink}>
            Sign Up
          </Link>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttons: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'column',
    gap: 10,
  },
  emailLogin: {
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  frame: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  headingFrame: {
    alignItems: 'center',
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 5,
  },
  line: {
    borderBottomColor: Colors.black,
    borderBottomWidth: 1,
    width: 93,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 15,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: '100%',
  },
  loginPage: {
    alignItems: 'center',
    backgroundColor: Colors.secondary, // Changed from Colors.background to Colors.secondary
    borderRadius: 44,
    flex: 1,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    width: '100%',
  },
  loginText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  mainSection: {
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 20,
    justifyContent: 'flex-start',
    marginTop: 20,
    padding: 30,
    width: '90%',
  },
  missionText: {
    color: Colors.black,
    fontSize: 16,
    textAlign: 'center',
  },
  orLoginText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signupLink: {
    color: Colors.link,
  },
  signupText: {
    fontSize: 16,
    fontWeight: '400',
    marginTop: 20,
    textAlign: 'center',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: Colors.black,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: '100%',
  },
  submitText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  textInput: {
    borderColor: Colors.border,
    borderRadius: 15,
    borderWidth: 1,
    marginVertical: 10,
    padding: 10,
    width: '100%',
  },
  welcome: {
    color: Colors.black,
    fontSize: 48,
    fontWeight: '600',
    textAlign: 'left',
  },
});

async function logIn(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return userCredential.user;
  } catch (error) {
    if (error) {
      throw error;
    }
    throw new Error('Failed to log in. Please try again.');
  }
}
