import { FirebaseStorageError } from '@/types/firebaseErrors';
import storage from '@react-native-firebase/storage';

// this file handles the uploading and downloading of files to firebase storage
// it is mainly used in the recording service to upload and download the audio files.

export const uploadFile = async (
  file: Blob | Uint8Array | ArrayBuffer,
  fileName: string,
): Promise<void> => {
  const reference = storage().ref(fileName);

  // Upload file and metadata
  const task = reference.put(file, {
    contentType: 'audio/m4a',
  });

  // Listen for state changes, errors, and completion of the upload.
  task.on('state_changed', (taskSnapshot) => {
    const progress =
      (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
    console.log(`Upload is ${progress}% done`);
    switch (taskSnapshot.state) {
      case storage.TaskState.PAUSED:
        console.log('Upload is paused');
        break;
      case storage.TaskState.RUNNING:
        console.log('Upload is running');
        break;
    }
  });

  try {
    await task;
    const downloadURL = await reference.getDownloadURL();
    console.log('File available at', downloadURL);
  } catch (error) {
    const firebaseError = error as FirebaseStorageError;
    switch (firebaseError.code) {
      case 'storage/unauthorized':
        // User doesn't have permission to access the object
        break;
      case 'storage/canceled':
        // User canceled the upload
        break;
      case 'storage/unknown':
        // Unknown error occurred
        break;
    }
    console.error('Upload failed:', firebaseError);
  }
};

export const downloadFile = async (fileName: string): Promise<string> => {
  const reference = storage().ref(fileName);
  return await reference.getDownloadURL();
};

const storageService = {
  uploadFile,
  downloadFile,
};

export default storageService;
