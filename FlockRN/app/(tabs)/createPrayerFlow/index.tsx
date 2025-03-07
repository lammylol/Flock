import { useCallback, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import useRecording from '@/hooks/recording/useRecording';
import { ScrollView } from 'react-native';

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

  const recordPrayer = () => {
    // Record the prayer using the recording hook
    router.push('/createPrayerFlow/voiceRecording');
  };

  const { resetRecording } = useRecording();

  useFocusEffect(
    useCallback(() => {
      resetRecording(); // Reset state when navigating back to index
      setContent(''); // Reset content when navigating back to index
    }, []),
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <TextInput
          style={[styles.input, styles.contentInput]}
          placeholder="Write your prayer here..."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={isLoading}
        >
          <ThemedText style={styles.buttonText}>Next</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={recordPrayer}
          disabled={isLoading}
        >
          <ThemedText style={styles.buttonText}>Record Prayer</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    marginBottom: 16,
    marginTop: 16,
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
