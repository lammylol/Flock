import { useCallback, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import useRecording from '@/hooks/recording/useRecording';
import WaveForm from '@/components/ui/RecordingSymbol';
import { ThemedScrollView } from '@/components/ThemedScrollView';

export default function PrayerWriteScreen() {
  const [content, setContent] = useState('');

  const handleNext = () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write your prayer before continuing');
      return;
    }

    // Navigate to metadata screen with the prayer content
    router.push({
      pathname: '/(tabs)/(createPrayer)/prayerMetadata',
      params: { content: content.trim() },
    });
  };

  const recordPrayer = () => {
    // Record the prayer using the recording hook
    router.push('/(tabs)/(createPrayer)/voiceRecording');
  };

  const { resetRecording } = useRecording();

  useFocusEffect(
    useCallback(() => {
      resetRecording(); // Reset state when navigating back to index
      setContent(''); // Reset content when navigating back to index
    }, []),
  );

  return (
    <ThemedScrollView style={styles.mainContainer}>
      <TextInput
        style={styles.contentInput}
        placeholder="Write your prayer..."
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
        placeholderTextColor="#777"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleNext}
        disabled={!content.trim()}
      >
        <ThemedText style={styles.buttonText}>Next</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={recordPrayer}>
        <View style={styles.recordingButtonText}>
          <WaveForm />
          <ThemedText style={styles.buttonText}>Record Prayer</ThemedText>
        </View>
      </TouchableOpacity>
    </ThemedScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Colors.purple,
    borderRadius: 30,
    padding: 16,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  contentInput: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    flex: 1,
    fontSize: 16,
    padding: 16,
    textAlignVertical: 'top',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  recordingButtonText: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    verticalAlign: 'middle',
  },
});
