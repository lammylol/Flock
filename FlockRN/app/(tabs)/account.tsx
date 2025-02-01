import { StyleSheet, Platform } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScrollView from '@/components/ScrollView';
import useAuth from '@/hooks/useAuth';
import Button from '@/components/Button';
import { router } from 'expo-router';
import { HelloWave } from '@/components/HelloWave';

export default function TabTwoScreen() {
  const { user, signOut } = useAuth();
  return (
    <ScrollView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{user?.displayName ?? 'Account'}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText>{Platform.OS}</ThemedText>
        <Button
          label="Sign out"
          onPress={() => {
            signOut;
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
