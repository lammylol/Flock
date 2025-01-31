import { StyleSheet, Image, Platform } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ScrollView from "@/components/ScrollView";
import useAuth from "@/hooks/useAuth";
import Button from "@/components/Button";

export default function TabTwoScreen() {
  const { user, signOut } = useAuth();
  return (
    <ScrollView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{user?.displayName ?? "Login"}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        {Platform.OS}
        <Button label="Sign out" onPress={() => signOut} theme="primary" />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
});
