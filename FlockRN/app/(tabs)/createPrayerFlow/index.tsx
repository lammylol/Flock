import { useCallback, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, View, SafeAreaView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import useRecording from '@/hooks/recording/useRecording';

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText>Cancel</ThemedText>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {/* Removed "Pray" text from here */}
        </View>
        <TouchableOpacity>
          <ThemedText>Save as Draft</ThemedText>
        </TouchableOpacity>
      </View>
      
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerCenter: {
    // Empty center space where "Pray" used to be
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  mainContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  contentInput: {
    flex: 1,
    backgroundColor: Colors.secondary, // Beige background
    textAlignVertical: 'top',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#9747FF', // Exact purple color specified
    borderRadius: 30, // More rounded corners to match Figma
    marginBottom: 16,
    padding: 16,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  }
});