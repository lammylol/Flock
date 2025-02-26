import useAudioRecordingService from '../../services/recording/audioRecordingService';
import {
    useSpeechRecognitionService,
    transcribeAudioFile,
} from '../../services/recording/transcriptionService';
import { AudioModule } from 'expo-audio';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { useEffect, useState } from 'react';

const useRecording = (setContent: (value: string) => void) => {
    const { record, stopRecording } = useAudioRecordingService();
    const { transcription, setTranscription } = useSpeechRecognitionService();
    const [recording, setRecording] = useState<'none' | 'recording' | 'complete'>(
        'none',
    );

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