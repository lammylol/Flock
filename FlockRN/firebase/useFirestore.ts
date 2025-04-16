import { getFirestore } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { getAnalytics } from '@react-native-firebase/analytics';

export const useFirestore = () => {
  const db = getFirestore();
  const auth = getAuth();
  const analytics = getAnalytics();

  return { flockDb: db, auth, analytics };
};
