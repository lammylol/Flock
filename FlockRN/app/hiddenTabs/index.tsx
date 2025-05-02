import { StyleSheet } from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { WeekCalendar } from '@/components/ui/calendar';
import useAuthContext from '@/hooks/useAuthContext';

const HomeScreen = () => {
  const { user } = useAuthContext();
  const greeting = user?.displayName ? `Hi ${user.displayName}` : 'Hi there';

  return (
    <ThemedScrollView style={styles.header}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{greeting}</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <WeekCalendar />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="default">Reminders</ThemedText>
        <ThemedText type="body">
          Your upcoming reminders will appear here
        </ThemedText>
      </ThemedView>
    </ThemedScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  header: {
    padding: 32,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
