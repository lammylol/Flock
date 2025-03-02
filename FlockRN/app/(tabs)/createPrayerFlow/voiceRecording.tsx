// Screen for when voice recording is recording.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useRecording from '@/hooks/recording/useRecording';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';

const VoiceRecording = () => {
  const { handleRecordPrayer, recording, transcription } = useRecording();
  const [content, setContent] = useState('Recording...');

  useEffect(() => {
    handleRecordPrayer();
  }, []);

  useEffect(() => {
    if (transcription) {
      setContent(transcription);
    } else {
      setContent('Recording...');
    }
  });

    /* handles setting the content for the next screen. Transcription will not 
  be carried over if "transcription unavailable. Transcription Unavailable is
  set in RecordingContext.tsx" */
  const handleFinish = () => {
    const finalContent =
    transcription === 'transcription unavailable' ? '' : transcription.trim();

    // Navigate to metadata screen with the prayer content
    router.push({
      pathname: '/createPrayerFlow/prayerMetadata',
      params: { content: finalContent.trim() },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.recordingText}>{content}</Text>
      <TouchableOpacity
        onPress={handleRecordPrayer}
        style={[
          styles.button,
          recording === 'recording' && styles.recordingButton,
        ]}
      >
        <Text style={styles.buttonText}>
          {recording === 'recording' ? 'Stop Recording' : 'Record Again'}
        </Text>
      </TouchableOpacity>

      {recording === 'complete' && (
        <TouchableOpacity
          onPress={handleFinish}
          style={[
            styles.button,
            recording === 'complete' && styles.finishButton,
          ]}
        >
          <Text style={styles.buttonText}>
            Finish
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    marginTop: 16,
    padding: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  recordingText: {
    fontSize: 24,
    marginBottom: 16,
  },
  recordingButton: {
    backgroundColor: '#FF0000'
  },
  finishButton: {
    backgroundColor: '#0000FF'
  },
});

export default VoiceRecording;
