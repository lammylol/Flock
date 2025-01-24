import { View, Text, Button, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useRouter, Link } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import { auth } from "@/firebase/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
    const router = useRouter();
    const email = "";
    const password = "";

    const handleLogin = async () => {
        try {
            const user = await logIn(email, password);
            console.log('Login successful:', user);
            // Navigate to another screen after successful login
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Login error:', error.message);
            // alert(error.message); // Show user-friendly error
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
                    />
                    <TextInput
                        style={styles.textInput}
                        placeholder="Enter your password"
                        placeholderTextColor="#C6C6C8"
                        secureTextEntry
                    />
                    <TouchableOpacity style={styles.submitButton} onPress={handleLogin} >
                        <Text style={styles.submitText}>Login</Text>
                    </TouchableOpacity>
                </View>

                {/* Signup Section */}
                <Text style={styles.signupText}>
                    Don't have an account?{' '}
                    <Link href="/auth/signup" style={styles.signupLink}>Sign Up</Link>
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
};

const styles = StyleSheet.create({
    loginPage: {
        backgroundColor: '#f1eee0',
        borderRadius: 44,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        width: '100%',
    },
    headingFrame: {
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    welcome: {
        color: '#000000',
        fontSize: 48,
        fontWeight: '600',
        textAlign: 'left',
    },
    missionText: {
        color: '#000000',
        fontSize: 16,
        textAlign: 'center',
    },
    mainSection: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 30,
        width: '90%',
        marginTop: 20,
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    buttons: {
        flexDirection: 'column',
        gap: 10,
        alignItems: 'center',
        alignSelf: 'stretch',
    },
    loginButton: {
        backgroundColor: '#9d9fe1',
        borderRadius: 15,
        paddingVertical: 5,
        paddingHorizontal: 10,
        width: '100%',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
    },
    emailLogin: {
        marginTop: 20,
        alignItems: 'center',
        width: '100%',
    },
    frame: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    line: {
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        width: 93,
    },
    orLoginText: {
        fontSize: 16,
        fontWeight: '500',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#C6C6C8',
        borderRadius: 15,
        padding: 10,
        width: '100%',
        marginVertical: 10,
    },
    submitButton: {
        backgroundColor: '#000000',
        borderRadius: 15,
        paddingVertical: 5,
        paddingHorizontal: 10,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
    },
    signupText: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '400',
        marginTop: 20,
    },
    signupLink: {
        color: '#007aff',
    },
});

async function logIn(email: string, password: string) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in:', userCredential.user);
        return userCredential.user;
    } catch (error: any) {
        console.error('Login failed:', error);
        throw new Error(error.message || 'Failed to log in. Please try again.');
    }
};
