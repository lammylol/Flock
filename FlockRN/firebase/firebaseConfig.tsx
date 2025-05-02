// src/firebase.ts

import app from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

// No config needed — config is handled natively through plist/json files
// placed in `ios/` and `android/` directories during setup

console.log('Firebase app name:', app.app().name); // should print "[DEFAULT]"
export const auth = getAuth();
export const db = getFirestore();
