import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScrollView from '@/components/ScrollView';
import useAuth from '@/hooks/useAuth';
import Button from '@/components/Button';
import { router } from 'expo-router';
// Remove unused HelloWave import

export default function TabTwoScreen() {
  const { user, signOut } = useAuth();
  return (
    <ScrollView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{user?.displayName ?? 'Account'}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText>Your Account</ThemedText>
        <Button
          label="Sign out"
          onPress={() => {
            signOut(); // Fixed: Add parentheses to call the function
            router.replace('/auth/login');
          }}
        />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
