// Screen for when voice recording is recording.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import useRecording from '@/hooks/recording/useRecording';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import {
  RecordButton,
  FinishButton,
  RetryButton,
} from '@/components/RecordingButton';

const VoiceRecording = () => {
  const {
    handleRecordPrayer,
    recording,
    transcription,
    audioFile,
    resetRecording,
  } = useRecording();
  const [content, setContent] = useState('Recording...');
  const [timer, setTimer] = useState(0);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    handleRecordPrayer();
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

  useEffect(() => {
    if (transcription) {
      setContent(transcription);
      console.log(transcription);
    } else {
      setContent('no transcription available');
    }
  }, [transcription]);

  /* handles setting the content for the next screen. Transcription will not 
be carried over if "transcription unavailable. Transcription Unavailable is
set in RecordingContext.tsx" */
  const handleFinish = () => {
    // Navigate to metadata screen with the prayer content
    router.push({
      pathname: '/createPrayerFlow/prayerMetadata',
    });
  };

  /* handles retry" */
  const handleRetry = () => {
    resetRecording();
    handleRecordPrayer();
    setTimer(0);
  };

  return (
    <View style={styles.container}>
      {/* Recording Card */}
      <LinearGradient
        colors={['#8E44AD', '#DCC6E0']}
        style={styles.recordingCard}
      >
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
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
  },
  horizontalContainer: {
    flex: 0,
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  recordingCard: {
    alignItems: 'center',
    borderRadius: 20,
    flex: 1,
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 24,
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
