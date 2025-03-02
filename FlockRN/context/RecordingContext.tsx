// This file is a context file that provides a context for recording prayers.
// It uses the useAudioRecordingService and useSpeechRecognitionService hooks to record and transcribe audio files.
// It does not upload to Firebase Storage.

import useAudioRecordingService from '@/services/recording/audioRecordingService';
import {
  useSpeechRecognitionService,
  transcribeAudioFile,
} from '@/services/recording/transcriptionService';
import { AudioModule } from 'expo-audio';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useEffect, useState, createContext } from 'react';
import { ReactNode } from 'react';

interface RecordingContextType {
  recording: 'none' | 'recording' | 'complete';
  handleRecordPrayer: () => Promise<void>;
  audioFile: any;
  transcription: string;
  permissionsGranted: boolean;
  requestPermissions: () => Promise<void>;
  resetRecording: () => void;
}

// Create context that allows components to access recording state and functions.
export const RecordingContext = createContext<RecordingContextType | null>(
  null,
);

export const RecordingProvider = ({ children }: { children: ReactNode }) => {
  const { record, stopRecording } = useAudioRecordingService();
  const { transcription, setTranscription } = useSpeechRecognitionService();
  const [recording, setRecording] = useState<'none' | 'recording' | 'complete'>(
    'none',
  );
  const [audioFile, setAudioFile] = useState<Blob | null>(null);
  const [permissionsGranted, setPermissions] = useState(false);

  const requestPermissions = async () => {
    const recordPermission = await AudioModule.getRecordingPermissionsAsync();
    const speechPermission =
      await ExpoSpeechRecognitionModule.getSpeechRecognizerPermissionsAsync();

    if (!recordPermission.granted || !speechPermission.granted) {
      await AudioModule.requestRecordingPermissionsAsync();
      await ExpoSpeechRecognitionModule.requestSpeechRecognizerPermissionsAsync();
    } else {
      setPermissions(true);
    }
  };

  const resetRecording = () => {
    setRecording('none'); // Reset context state
    setTranscription(''); // Reset transcription state
    setAudioFile(null); // Reset audio file state
  };

  // This useEffect hook will run once when the component mounts.
  // It will request permissions for recording and speech recognition.
  // Can be removed here if permissions are only requested when user clicks 'record'.
  useEffect(() => {
    requestPermissions();
  }, []);

  const handleRecordPrayer = async () => {
    try {
      await requestPermissions();

      if (recording === 'none' || recording === 'complete') {
        setRecording('recording');
        await record();
      } else {
        const uri = await stopRecording();
        setRecording('complete');

        // Set audio file to be used for transcription.
        if (uri) {
          const response = await fetch(uri);
          const blob = await response.blob();
          setAudioFile(blob);

          const pastTranscription = transcription;
          
          setTranscription((prev) => prev ? `${prev} Transcribing...` : 'Transcribing...');
          await transcribeAudioFile(uri);

          // Append transcription instead of replacing it
          setTranscription((pastTranscription !== 'Transcribing...' ? `${pastTranscription} ${transcription}` : transcription));
        } else {
          console.warn('Recording failed or AudioURI not found');
        }
      }
    } catch (error) {
      console.error('Error during speech recognition:', error);
    }
  };

  return (
    <RecordingContext.Provider
      value={{
        recording,
        handleRecordPrayer,
        audioFile,
        transcription,
        permissionsGranted,
        requestPermissions,
        resetRecording,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
};
