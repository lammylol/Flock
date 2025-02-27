import useAudioRecordingService from '../../services/recording/audioRecordingService';
import {
    useSpeechRecognitionService,
    transcribeAudioFile,
} from '../../services/recording/transcriptionService';
import { AudioModule } from 'expo-audio';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useEffect, useState } from 'react';
import firebaseStorageService from '@/services/recording/firebaseStorageService';
import useAuth from '@/hooks/useAuth';

const useRecording = (setContent: (value: string) => void) => {
    const { record, stopRecording } = useAudioRecordingService();
    const { transcription, setTranscription } = useSpeechRecognitionService();
    const [recording, setRecording] = useState<'none' | 'recording' | 'complete'>(
        'none',
    );
    const { user } = useAuth(); // Get the user from the useAuth hook

    useEffect(() => {
        if (transcription) {
            setContent(transcription);
        }
    }, [transcription]); // Runs whenever `transcription` changes

    const requestPermissions = async () => {
        const recordPermission = await AudioModule.getRecordingPermissionsAsync();
        const speechPermission =
            await ExpoSpeechRecognitionModule.getSpeechRecognizerPermissionsAsync();

        if (!recordPermission.granted || !speechPermission.granted) {
            await AudioModule.requestRecordingPermissionsAsync();
            await ExpoSpeechRecognitionModule.requestSpeechRecognizerPermissionsAsync();
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

                    const response = await fetch(uri);
                    const blob = await response.blob();

                    // Upload the audio file to Firebase Storage with fileName as `users/${userId}/prayers/${userId}-${timestamp}.m4a`
                    const fileName = `users/${user?.uid}/prayers/${user?.uid}-${Date.now()}.m4a`;

                    await firebaseStorageService.uploadFile(blob, fileName);
                } else {
                    console.warn('Recording failed or AudioURI not found');
                }
            }
        } catch (error) {
            console.error('Error during speech recognition:', error);
        }
    };

    return { recording, handleRecordPrayer };
};

export default useRecording;