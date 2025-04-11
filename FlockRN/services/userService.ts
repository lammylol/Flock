import firestore from '@react-native-firebase/firestore'; // Importing Firestore from react-native-firebase
import { FirestoreCollections } from '@/schema/firebaseCollections';
import { UserProfileResponse } from '@/types/firebase';

class UserService {
  private userCollection = firestore().collection(FirestoreCollections.USERS); // Using react-native-firebase firestore

  async getUser(userId: string): Promise<UserProfileResponse | null> {
    try {
      // Reference to the user document
      const userDoc = this.userCollection.doc(userId);

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
