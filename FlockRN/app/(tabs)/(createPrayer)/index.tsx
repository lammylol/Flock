import { useCallback, useLayoutEffect, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  View,
  Button,
  Platform,
  Keyboard,
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import useRecording from '@/hooks/recording/useRecording';
import WaveForm from '@/components/ui/RecordingSymbol';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { ThemedKeyboardAvoidingView } from '@/components/ThemedKeyboardAvoidingView';

export default function PrayerWriteScreen() {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);

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
    <ThemedKeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // Adjust if needed
    >
      <Stack.Screen
        options={{
          headerRight: () => (isFocused || content) ? <Button onPress={handleNext} title="Next" /> : null,
          headerLeft: () => isFocused ? <Button onPress={Keyboard.dismiss} title="Cancel" /> : null,
        }}
      />
      <ThemedScrollView style={styles.inputContainer}>
        <TextInput
          style={styles.contentInput}
          placeholder="Write your prayer..."
          value={content}
          onChangeText={setContent}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          textAlignVertical="top"
          placeholderTextColor="#777"
        />
        <TouchableOpacity style={styles.button} onPress={recordPrayer}>
          <View style={styles.recordingButtonText}>
            <WaveForm />
            <ThemedText style={styles.buttonText}>Record Prayer</ThemedText>
          </View>
        </TouchableOpacity>
      </ThemedScrollView>
    </ThemedKeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Colors.purple,
    borderRadius: 20,
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
    flexGrow: 1,
    fontSize: 16,
    padding: 16,
    textAlignVertical: 'top',
  },
  inputContainer: {
    flex: 1
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20
  },
  recordingButtonText: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    verticalAlign: 'middle',
  },
});
