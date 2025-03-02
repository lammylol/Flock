import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function PrayerWriteScreen() {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write your prayer before continuing');
      return;
    }

    // Navigate to metadata screen with the prayer content
    router.push({
      pathname: '/createPrayerFlow/prayerMetadata',
      params: { content: content.trim() },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={[styles.input, styles.contentInput]}
        placeholder="Write your prayer here..."
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
        autoFocus
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={isLoading}
      >
        <ThemedText style={styles.buttonText}>Next</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 16,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  contentInput: {
    height: 300,
    marginBottom: 20,
  },
  input: {
    borderColor: Colors.border,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    padding: 12,
  },
});
