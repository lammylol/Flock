import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from '@react-native-firebase/storage';

// this file handles the uploading and downloading of files to firebase storage
// it is mainly used in the recording service to upload and download the audio files.

const storage = getStorage();

// Define types for function parameters
export const uploadFile = async (
  file: Blob | Uint8Array | ArrayBuffer,
  fileName: string,
): Promise<void> => {
  // Create the file metadata
  /** @type {any} */
  const metadata = {
    contentType: 'audio/m4a',
  };

  // Upload file and metadata to the object fileName
  const storageRef = ref(storage, fileName);
  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  // Listen for state changes, errors, and completion of the upload.
  uploadTask.on(
    'state_changed',
    (snapshot) => {
      // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + progress + '% done');
      switch (snapshot.state) {
        case 'paused':
          console.log('Upload is paused');
          break;
        case 'running':
          console.log('Upload is running');
          break;
      }
    },
    (error) => {
      // A full list of error codes is available at
      // https://firebase.google.com/docs/storage/web/handle-errors
      switch (error.code) {
        case 'storage/unauthorized':
          // User doesn't have permission to access the object
          break;
        case 'storage/canceled':
          // User canceled the upload
          break;

        // ...

        case 'storage/unknown':
          // Unknown error occurred, inspect error.serverResponse
          break;
      }
    },
    () => {
      // Upload completed successfully, now we can get the download URL
      if (uploadTask.snapshot) {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log('File available at', downloadURL);
        });
      } else {
        console.error('Upload task snapshot is null.');
      }
    },
  );
};

export const downloadFile = async (fileName: string): Promise<string> => {
  const storageRef = ref(storage, fileName);
  return await getDownloadURL(storageRef);
};

const storageService = {
  uploadFile,
  downloadFile,
};

export default storageService;
