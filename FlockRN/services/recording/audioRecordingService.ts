import { useAudioRecorder, RecordingPresets } from 'expo-audio';

// audio recording service
export default function useAudioRecordingService() {
  // ----------- audio recording setup ---------------
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const record = async () => {
    try {
      audioRecorder.record(); // set function "record" to record audio
    } catch (error) {
      console.error('Error during audio recording setup:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop(); // set function "stop" to stop recording audio
      return audioRecorder.uri; // get the URI of the recorded audio
    } catch (error) {
      console.error('Error during audio recording setup:', error);
    }
  };

  return { record, stopRecording, audioRecorder };
}
