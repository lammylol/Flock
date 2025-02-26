import app from '@/firebase/firebaseConfig';
import { getStorage, ref } from 'firebase/storage';

// this file handles the uploading and downloading of files to firebase storage
// it is mainly used in the recording service to upload and download the audio files.

const storage = getStorage(app);

const uploadFile = async (file, fileName) => {
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
}

const downloadFile = async (fileName) => {
    const storageRef = ref(storage, fileName);
    const url = await getDownloadURL(storageRef);
    return url;
}