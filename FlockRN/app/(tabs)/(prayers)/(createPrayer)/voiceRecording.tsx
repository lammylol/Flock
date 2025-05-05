/* eslint-disable react-native/no-color-literals */
// Screen for when voice recording is recording.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useRecording from '@/hooks/recording/useRecording';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import {
  RecordButton,
  FinishButton,
  RetryButton,
} from '@/components/Prayer/PrayerViews/Recording/RecordingButton';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Colors } from '@/constants/Colors';

const VoiceRecording = () => {
  const { handleRecordPrayer, recording, resetRecording } = useRecording();
  const [timer, setTimer] = useState(0);
  const colorScheme = useThemeColor({}, 'backgroundVoiceRecording');
  const backgroundColor = useThemeColor({}, 'background');

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    handleRecordPrayer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // set timer only when recording is active
  useEffect(() => {
    if (recording === 'recording') {
      // Only start the timer when recording is active
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);

      return () => clearInterval(interval); // Cleanup when recording changes or component unmounts
    }
  }, [recording]);

  /* handles setting the content for the next screen. Transcription will not 
be carried over if "transcription unavailable. Transcription Unavailable is
set in RecordingContext.tsx" */
  const handleFinish = () => {
    // Navigate to metadata screen with the prayer content
    router.push({
      pathname: '/(tabs)/(prayers)/(createPrayer)/prayerMetadata',
      params: {
        hasTranscription: 'true',
        editMode: 'create',
      },
    });
  };

  /* handles retry" */
  const handleRetry = () => {
    resetRecording();
    handleRecordPrayer();
    setTimer(0);
  };

  return (
    <View
      style={[styles.backgroundContainer, { backgroundColor: backgroundColor }]}
    >
      <View style={[styles.container, { backgroundColor: colorScheme }]}>
        <View style={styles.upperSection}>
          <View style={styles.recordingIndicator}>
            <FontAwesome5 name="dot-circle" size={28} color="white" />
            <Text style={styles.recordingText}>
              {recording === 'recording' ? 'Recording' : 'Paused'}
            </Text>
          </View>

          <Text style={styles.timerText}>{formatTime(timer)}</Text>
        </View>

        <View style={styles.horizontalContainer}>
          {/* Stop Button */}
          <RecordButton
            isRecording={recording === 'recording'}
            onPress={handleRecordPrayer}
          />

          {recording === 'complete' && (
            <>
              <FinishButton onPress={handleFinish} />

              <RetryButton onPress={handleRetry} />
            </>
          )}
        </View>
        <View
          style={[styles.recordingCard, { backgroundColor: Colors.mildPurple }]}
        ></View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 40,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  horizontalContainer: {
    flex: 0,
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'space-between',
    marginBottom: 40,
    zIndex: 1,
  },
  recordingCard: {
    height: 1000,
    width: 1000,
    borderRadius: 500,
    position: 'absolute', // Float it over the container
    bottom: -700, // Adjust positioning as needed
    zIndex: 0,
  },
  recordingIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
    marginTop: 30,
  },
  recordingText: {
    color: 'white',
    fontSize: 28,
    fontWeight: '600',
    marginLeft: 8,
  },
  timerText: {
    color: 'white',
    fontSize: 64,
    fontWeight: 'bold',
  },
  upperSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VoiceRecording;
