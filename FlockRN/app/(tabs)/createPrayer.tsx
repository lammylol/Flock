import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { prayerService } from '@/services/prayer/prayerService';
import type { CreatePrayerDTO } from '../../types/firebase';
import useAuth from '@/hooks/useAuth';
import useRecording from '@/hooks/recording/useRecording';
import { ThemedView } from '@/components/ThemedView';

export default function CreatePrayerScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  const [isLoading, setIsLoading] = useState(false);
  const { recording, handleRecordPrayer } = useRecording(setContent);

  useEffect(() => {
    // Automatically redirect to prayer write screen when this tab is selected
    router.push('/prayer/prayerWrite');
  }, []);

  // // Return an empty view while redirecting
  // return <ThemedView />;

  const handleCreatePrayer = async () => {
    if (!title.trim() || !content.trim()) {
      return Alert.alert('Error', 'Please fill in all fields');
    }
    if (!user) {
      return Alert.alert('Error', 'You must be logged in to create a prayer');
    }

    setIsLoading(true);
    try {
      const prayerData: CreatePrayerDTO = {
        title: title.trim(),
        content: content.trim(),
        privacy,
        authorId: user.uid,
        authorName: user.displayName || '',
        status: 'Current',
        isPinned: false,
      };
      await prayerService.createPrayer(prayerData);
      Alert.alert('Success', 'Prayer created successfully');
      router.replace('/(tabs)/prayer');
    } catch (error) {
      console.error('Error creating prayer:', error);
      Alert.alert('Error', 'Failed to create prayer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Prayer Title"
        value={title}
        onChangeText={setTitle}
        maxLength={100}
      />
      <TextInput
        style={[styles.input, styles.contentInput]}
        placeholder="Prayer Content"
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Privacy:</Text>
        <Picker
          selectedValue={privacy}
          onValueChange={setPrivacy}
          style={styles.picker}
        >
          <Picker.Item label="Private" value="private" />
          <Picker.Item label="Public" value="public" />
        </Picker>
      </View>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleCreatePrayer}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Creating...' : 'Create Prayer'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleRecordPrayer}
        style={[
          styles.button,
          recording === 'recording' && styles.recordingButton,
        ]}
      >
        <Text style={styles.buttonText}>
          {recording === 'recording' ? 'Stop Recording' : 'Record Prayer'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginVertical: 10,
    padding: 16,
  },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  container: { backgroundColor: '#fff', flex: 1, padding: 20 },
  contentInput: { height: 150 },
  input: {
    borderColor: '#ddd',
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 16,
    padding: 12,
  },
  label: { fontSize: 16, marginBottom: 8 },
  picker: { borderColor: '#ddd', borderRadius: 8, borderWidth: 1 },
  pickerContainer: { marginBottom: 16 },
  recordingButton: { backgroundColor: '#FF0000' },
});
