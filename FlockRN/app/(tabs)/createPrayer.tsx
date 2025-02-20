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
import { prayerService } from '../../services/prayer/prayerService';
import type { CreatePrayerDTO } from '../../types/firebase';
import useAuth from '@/hooks/useAuth';
import useAudioRecordingService from '@/services/recording/audioRecordingService';
import { useSpeechRecognitionService, transcribeAudioFile } from '@/services/recording/transcriptionService';
import { AudioModule } from 'expo-audio';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';

export default function CreatePrayerScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private'>('private');
  const [isLoading, setIsLoading] = useState(false);
  const { record, stopRecording } = useAudioRecordingService();
  const { transcription, setTranscription } = useSpeechRecognitionService();
  const [recording, setRecording] = useState<'none' | 'recording' | 'complete'>('none');
  
  useEffect(() => {
    if (transcription) {
      setContent(transcription);
    }
  }, [transcription]); // Runs whenever `transcription` changes

  const requestPermissions = async () => {
    const recordPermission = await AudioModule.getRecordingPermissionsAsync();
    const speechPermission = await ExpoSpeechRecognitionModule.getSpeechRecognizerPermissionsAsync();

    if (!recordPermission.granted || !speechPermission.granted) {
      await AudioModule.requestRecordingPermissionsAsync();
      await ExpoSpeechRecognitionModule.requestSpeechRecognizerPermissionsAsync();
    }
  };

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
        authorName: user.displayName,
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

  const handleRecordPrayer = async () => {
    try {
      await requestPermissions();

      if (recording === 'none' || recording === 'complete') {
        setRecording('recording');
        await record();
      } else {
        const uri = await stopRecording();
        setRecording('complete');

        if (uri) {
          setTranscription('Transcribing...');
          await transcribeAudioFile(uri);
        } else {
          console.warn('Recording failed or AudioURI not found');
        }
      }
    } catch (error) {
      console.error('Error during speech recognition:', error);
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
        <Text style={styles.buttonText}>{isLoading ? 'Creating...' : 'Create Prayer'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleRecordPrayer}
        style={[styles.button, recording === 'recording' && styles.recordingButton]}
      >
        <Text style={styles.buttonText}>{recording === 'recording' ? 'Stop Recording' : 'Record Prayer'}</Text>
      </TouchableOpacity>
      <Text>{"Transcription: " + transcription}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  contentInput: { height: 150 },
  pickerContainer: { marginBottom: 16 },
  label: { fontSize: 16, marginBottom: 8 },
  picker: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  button: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center', marginVertical: 10 },
  buttonDisabled: { backgroundColor: '#ccc' },
  recordingButton: { backgroundColor: '#FF0000' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
