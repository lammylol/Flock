import {
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionModule,
  AudioEncodingAndroid,
} from 'expo-speech-recognition';
import { useState } from 'react';
import { Platform } from 'react-native';

// Speech Recognition Service Hook. Enables expo-speech-recognition as a hook.
export function useSpeechRecognitionService() {
  const [transcription, setTranscription] = useState('');
  const pastTranscription = transcription;

  // ----------- speech recognition setup ---------------
  useSpeechRecognitionEvent('result', (event) => {
    // const newTranscription = event.results[0]?.transcript
    // Append transcription instead of replacing it
    // setTranscription(`${pastTranscription} ${newTranscription}`);
    setTranscription(event.results[0]?.transcript);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setTranscription('transcription unavailable');
    console.log('error code:', event.error, 'error message:', event.message);
  });

  return { transcription, setTranscription };
}

// Transcribe an Audio File (recording) using the Speech Recognition API
export async function transcribeAudioFile(
  uri: string /* ex. "file:///path/to/audio.wav" */,
) {
  try {
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      // Recommended: true on iOS, false on Android, unless the speech model is installed, which you can check with `getSupportedLocales()`
      requiresOnDeviceRecognition: Platform.OS === 'ios',
      audioSource: {
        /** Local file URI */
        uri: uri,
        /** [Android only] The number of channels in the source audio. */
        audioChannels: 1,
        /** [Android only] A value from AudioFormat - https://developer.android.com/reference/android/media/AudioFormat */
        audioEncoding: AudioEncodingAndroid.ENCODING_PCM_16BIT,
        /** [Android only] Audio sampling rate in Hz. */
        sampleRate: 16000,
        /**
         * The delay between chunks of audio to stream to the speech recognition service.
         * Use this setting to avoid being rate-limited when using network-based recognition.
         * If you're using on-device recognition, you may want to increase this value to avoid unprocessed audio chunks.
         * Default: 50ms for network-based recognition, 15ms for on-device recognition
         */
        chunkDelayMillis: undefined,
      },
      addsPunctuation: true,
    });
  } catch (error) {
    console.error('Error during audio transcription setup:', error);
    reject(error);
  }
}
