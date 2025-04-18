import { FirestoreCollections } from '@/schema/firebaseCollections';
import { UserProfileResponse } from '@/types/firebase';
import { getFirestore } from '@react-native-firebase/firestore';

class UserService {
  async getUser(userId: string): Promise<UserProfileResponse | null> {
    try {
      const flockDb = getFirestore();
      const usersCollection = flockDb.collection(FirestoreCollections.USERS);
      // Reference to the user document
      const userDoc = usersCollection.doc(userId);

      // Fetch the document snapshot
      const userSnap = await userDoc.get();

      if (!userSnap.exists) return null;

      // Return user data with the ID
      return {
        id: userSnap.id,
        ...userSnap.data(),
      } as UserProfileResponse;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }
}

export const userService = new UserService();
