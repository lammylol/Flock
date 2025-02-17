import { useState } from 'react';
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
  const { record, stopRecording, audioRecorder } = useAudioRecordingService();
  const { transcription, setTranscription } = useSpeechRecognitionService();
  const [recording, setRecording] = useState("none");

  const handleCreatePrayer = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a prayer');
      return;
    }

    setIsLoading(true);
    try {
      const prayerData = {
        title: title.trim(),
        content: content.trim(),
        privacy: privacy,
        authorId: user!.uid,
        authorName: user!.displayName,
        status: 'Current' as const,
        isPinned: false,
      } as CreatePrayerDTO;

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
      const recordingPermissions = await AudioModule.getRecordingPermissionsAsync();
      const speechRecognitionPermissions = await ExpoSpeechRecognitionModule.getSpeechRecognizerPermissionsAsync();

      // console.log("recognitionStatus:", speechRecognitionPermissions.status);
      // console.log("recognitionGranted:", speechRecognitionPermissions.granted);
      // console.log("recognitionCan ask again:", speechRecognitionPermissions.canAskAgain);
      // console.log("recognitionExpires:", speechRecognitionPermissions.expires);
      // console.log("recordingStatus:", recordingPermissions.status);
      // console.log("recordingGranted:", recordingPermissions.granted);
      // console.log("recordingCan ask again:", recordingPermissions.canAskAgain);
      // console.log("recordingExpires:", recordingPermissions.expires);

      // Request permissions if not granted
      if (!recordingPermissions.granted || !speechRecognitionPermissions.granted) {
        const recordPermission = await AudioModule.requestRecordingPermissionsAsync();
        const speechPermission = await ExpoSpeechRecognitionModule.requestSpeechRecognizerPermissionsAsync();

        if (!recordPermission || !speechPermission) {
          console.warn("Permissions not granted");
          return;
        }
      };

      // Start speech recording
      if (recording == "none" || recording == "complete") {
        setRecording("recording");
        await record();
      } else {
        const uri = await stopRecording();
        setRecording("complete");

        // Start transcription
        if (uri) {
          setTranscription("Transcribing...");
          await transcribeAudioFile(uri);
          setRecording("none");
        } else {
          console.warn("Recording not complete or AudioURI not found");
        }
      };

    } catch (error) {
      console.error("Error during speech recognition setup:", error);
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
          onValueChange={(value) => setPrivacy(value)}
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

      {recording != "recording" ? (
        <TouchableOpacity
          onPress={handleRecordPrayer}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Start</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => stopRecording()}
          style={[
            styles.button,
            { backgroundColor: '#FF0000' }
          ]}
        >
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
      )}

      <Text>
        {"transcription: " + transcription}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  contentInput: {
    height: 150,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
