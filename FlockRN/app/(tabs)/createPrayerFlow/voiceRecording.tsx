// Screen for when voice recording is recording.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useRecording from '@/hooks/recording/useRecording';
import { Colors } from '@/constants/Colors';

const VoiceRecording = () => {
  const { handleRecordPrayer } = useRecording();

  return (
    <View style={styles.container}>
      <Text style={styles.recordingText}>Recording...</Text>
      <TouchableOpacity style={styles.button} onPress={handleRecordPrayer}>
        <Text style={styles.buttonText}>Stop Recording</Text>
      </TouchableOpacity>
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
});

export default VoiceRecording;
