import { db } from '@/firebase/firebaseConfig';
import { FirestoreCollections } from '@/schema/firebaseCollections';
import { UserProfileResponse } from '@/types/firebase';
import { collection, doc, getDoc } from '@react-native-firebase/firestore';

class UserService {
  private userCollection = collection(db, FirestoreCollections.USERS);

  async getUser(userId: string): Promise<UserProfileResponse | null> {
    try {
      const userDoc = doc(this.userCollection, userId);
      const userSnap = await getDoc(userDoc);

      if (!userSnap.exists()) return null;

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
