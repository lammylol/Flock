import { RecordingContext } from '@/context/RecordingContext';
import { useContext } from 'react';

// // Upload the audio file to Firebase Storage with fileName as `users/${userId}/prayers/${userId}-${timestamp}.m4a`
// const fileName = `users/${user?.uid}/prayers/${user?.uid}-${Date.now()}.m4a`;

// await firebaseStorageService.uploadFile(blob, fileName);
const useRecording = () => {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecording must be used within a RecordingProvider');
  }

  return context;
};

export default useRecording;
