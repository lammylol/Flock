import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { auth } from '@/firebase/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import { Colors } from '@/constants/Colors';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const user = await logIn(email, password);
      console.log('Login successful:', user);
      router.replace('/(tabs)');
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.error('Login error:', error.message);
      } else {
        console.error('Unknown login error:', error);
      }
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
          {/* <Text
                        style={styles.signupLink}
                        onPress={() => router.replace('/auth/signup')}
                    >
                        Sign up
                    </Text> */}
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
    borderBottomColor: Colors.dark.text,
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
    backgroundColor: Colors.background,
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
    color: '#000000',
    fontSize: 16,
    textAlign: 'center',
  },
  orLoginText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signupLink: {
    color: '#007aff',
  },
  signupText: {
    fontSize: 16,
    fontWeight: '400',
    marginTop: 20,
    textAlign: 'center',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: '100%',
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  textInput: {
    borderColor: '#C6C6C8',
    borderRadius: 15,
    borderWidth: 1,
    marginVertical: 10,
    padding: 10,
    width: '100%',
  },
  welcome: {
    color: '#000000',
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
    if (error instanceof FirebaseError) {
      throw error;
    }
    throw new Error('Failed to log in. Please try again.');
  }
}
