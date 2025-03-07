import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import useAuth from '@/hooks/useAuth';
import Button from '@/components/Button';
import { router } from 'expo-router';
import { auth } from '@/firebase/firebaseConfig';

export default function TabTwoScreen() {
  const { user, signOut } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Account</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText>{user?.displayName}</ThemedText>
        <Button
          label="Sign out"
          onPress={async () => {
            await signOut(auth); // Pass the auth instance
            router.replace('/auth/login');
          }}
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
