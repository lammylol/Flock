import { StyleSheet } from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScrollView from '@/components/ScrollView';
import useAuth from '@/hooks/useAuth';
import { WeekCalendar } from '@/components/ui/calendar';

export default function HomeScreen() {
  const { user } = useAuth();
  const greeting = user?.displayName ? `Hi ${user.displayName}` : 'Hi there';

  return (
    <ScrollView>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
