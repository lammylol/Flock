import { useCallback, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  View,
  SafeAreaView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import useRecording from '@/hooks/recording/useRecording';
import WaveForm from '@/components/ui/RecordingSymbol';

export default function PrayerWriteScreen() {
  const [content, setContent] = useState('');

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
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
          style={[styles.button, !content.trim() && styles.buttonDisabled]}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Colors.purple,
    borderRadius: 30,
    marginBottom: 16,
    padding: 16,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
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
    marginBottom: 16,
    padding: 16,
    textAlignVertical: 'top',
  },
  mainContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  recordingButtonText: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    verticalAlign: 'middle',
  },
  safeArea: {
    backgroundColor: Colors.white,
    flex: 1,
  },
});
