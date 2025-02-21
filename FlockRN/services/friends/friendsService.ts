import { db } from '@/firebase/firebaseConfig';
import {
  FirestoreCollections,
  FriendRequestFields,
} from '@/schema/firebaseCollections';
import { UserProfileResponse } from '@/types/firebase';
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';

class FriendsService {
  private userCollection = collection(db, FirestoreCollections.USERS);
  async searchUsers(searchTerm: string): Promise<UserProfileResponse[]> {
    try {
      const lowerSearchTerm = searchTerm.toLowerCase();

      // Create three queries, one for each field
      const queries = [
        'normalizedUsername',
        'normalizedFirstName',
        'normalizedLastName',
      ].map((field) =>
        query(
          this.userCollection,
          where(field, '>=', lowerSearchTerm),
          where(field, '<=', lowerSearchTerm + '\uf8ff'),
        ),
      );

      // Execute the queries concurrently

      const snapshots = await Promise.all(queries.map(getDocs));
      const resultsMap = new Map<string, any>();
      snapshots.forEach((snapshot) => {
        snapshot.forEach((doc) =>
          resultsMap.set(doc.id, { id: doc.id, ...doc.data() }),
        );
      });

      return Array.from(resultsMap.values());
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
  async sendFriendRequest(senderId: string, receiverId: string) {
    try {
      // References for the friend request documents in both subcollections
      const senderSentRef = doc(
        this.userCollection,
        senderId,
        FriendRequestFields.SENT,
        receiverId,
      );
      const receiverReceivedRef = doc(
        this.userCollection,
        receiverId,
        FriendRequestFields.RECEIVED,
        senderId,
      );

      // Create a batch write to update both documents atomically
      const batch = writeBatch(db);
      batch.set(senderSentRef, {
        to: receiverId,
        status: 'pending',
        timestamp: serverTimestamp(),
      });
      batch.set(receiverReceivedRef, {
        from: senderId,
        status: 'pending',
        timestamp: serverTimestamp(),
      });

      // Commit the batch write
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: error.message };
    }
  }
  async acceptFriendRequest(senderId: string, receiverId: string) {
    try {
      // References to the friend request documents
      const senderFriendRequestRef = doc(
        this.userCollection,
        senderId,
        FriendRequestFields.SENT,
        receiverId,
      );
      const receiverFriendRequestRef = doc(
        this.userCollection,
        receiverId,
        FriendRequestFields.RECEIVED,
        senderId,
      );

      // References to the user documents
      const senderUserRef = doc(this.userCollection, senderId);
      const receiverUserRef = doc(this.userCollection, receiverId);

      // Create a batch write to perform all operations atomically
      const batch = writeBatch(db);

      // Remove friend request documents (you can choose to delete or update the status if you prefer)
      batch.delete(senderFriendRequestRef);
      batch.delete(receiverFriendRequestRef);

      // Update both users' friend arrays
      batch.update(senderUserRef, {
        friends: arrayUnion(receiverId),
      });
      batch.update(receiverUserRef, {
        friends: arrayUnion(senderId),
      });

      // Commit the batch
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: error.message };
    }
  }

  async getPendingFriendRequests(userId: string) {
    try {
      // Reference to the user's friendRequestsReceived subcollection
      const requestsRef = collection(
        this.userCollection,
        userId,
        FriendRequestFields.RECEIVED,
      );

      // Query for pending requests. Here we assume that a pending request
      // does not have an acceptedTimestamp field.
      const q = query(requestsRef, where('acceptedTimestamp', '==', null));

      // Execute the query
      const querySnapshot = await getDocs(q);

      // Map results into an array of objects
      const pendingRequests = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return pendingRequests;
    } catch (error) {
      console.error('Error fetching pending friend requests:', error);
      return [];
    }
  }
}

export const friendsService = new FriendsService();
