// src/firebase.ts

import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

// No config needed — config is handled natively through plist/json files
// placed in `ios/` and `android/` directories during setup

export const auth = getAuth();
export const db = getFirestore();
