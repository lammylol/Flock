import { StyleSheet, Switch } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import useAuth from '@/hooks/useAuth';
import Button from '@/components/Button';
import { router } from 'expo-router';
import { auth } from '@/firebase/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { userFlags, UserFlags } from '@/types/UserFlags';
import MuiStack from '@/components/MuiStack';

export default function TabTwoScreen() {
  const { user, signOut } = useAuth();

  const [optInAI, setOptInAI] = useState(false);

  const handleToggleOptInToAI = async () => {
    const newOptInStatus = !optInAI;
    await AsyncStorage.setItem(
      UserFlags.optInAI,
      newOptInStatus.toString(),
      () => {
        setOptInAI(newOptInStatus);
      },
    );
  };

  useEffect(() => {
    const checkOptInStatus = async () => {
      const status = await AsyncStorage.getItem(UserFlags.optInAI);
      setOptInAI(status === 'true');
    };

    checkOptInStatus();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Account</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText>{user?.displayName}</ThemedText>

        {userFlags.map((flag) => (
          <MuiStack direction="row" key={flag.type}>
            <ThemedText>{flag.displayName}</ThemedText>
            <Switch
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={optInAI ? '#f5dd4b' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={handleToggleOptInToAI}
              value={optInAI}
            />
          </MuiStack>
        ))}
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
