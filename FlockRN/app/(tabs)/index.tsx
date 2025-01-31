import { StyleSheet } from "react-native";

import { HelloWave } from "@/components/HelloWave";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ScrollView from "@/components/ScrollView";
import useAuth from "@/hooks/useAuth";
import { WeekCalendar } from "@/components/ui/calendar";

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{`Hi ${user?.displayName}`}</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <WeekCalendar />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="default">Reminders</ThemedText>
        <ThemedText>reminders go here</ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
});
