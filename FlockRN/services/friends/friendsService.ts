import { db } from '@/firebase/firebaseConfig';
import {
  FirestoreCollections,
  FriendRequestFields,
} from '@/schema/firebaseCollections';
import {
  FriendRequest,
  ServiceResponse,
  UserProfileResponse,
} from '@/types/firebase';
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
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
      const snapshots = await Promise.all(queries.map(getDocs));

      // dedupe results
      const resultsMap = new Map<string, UserProfileResponse>();
      snapshots.forEach((snapshot) => {
        snapshot.forEach((doc) =>
          resultsMap.set(doc.id, {
            id: doc.id,
            ...doc.data(),
          } as UserProfileResponse),
        );
      });

      return Array.from(resultsMap.values());
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
  async sendFriendRequest(
    sendingUser: UserProfileResponse,
    receivingUser: UserProfileResponse,
  ): Promise<ServiceResponse> {
    try {
      const sendingUserId = sendingUser.id;
      const receivingUserId = receivingUser.id;

      const senderSentRef = doc(
        this.userCollection,
        sendingUserId,
        FriendRequestFields.SENT,
        receivingUserId,
      );
      const receiverReceivedRef = doc(
        this.userCollection,
        receivingUserId,
        FriendRequestFields.RECEIVED,
        sendingUserId,
      );

      const batch = writeBatch(db);
      batch.set(
        senderSentRef,
        {
          userId: receivingUserId,
          username: receivingUser.username,
          displayName: receivingUser.displayName,
          status: 'pending',
          timestamp: new Date(),
        } as FriendRequest,
        { merge: true },
      );
      batch.set(
        receiverReceivedRef,
        {
          userId: sendingUserId,
          username: sendingUser.username,
          displayName: sendingUser.displayName,
          status: 'pending',
          timestamp: new Date(),
        } as FriendRequest,
        { merge: true },
      );

      // Commit the batch write
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return {
        success: false,
        errorMessage:
          error instanceof Error ? error.message : 'UNKNOWN_SEND_REQUEST_ERROR',
      };
    }
  }
  async acceptFriendRequest(
    senderId: string,
    receiverId: string,
  ): Promise<ServiceResponse> {
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

      // Update the status of both friend requests to 'accepted'
      batch.update(senderFriendRequestRef, {
        status: 'accepted',
      });
      batch.update(receiverFriendRequestRef, {
        status: 'accepted',
      });

      // Add both users to each other's friends array
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
      return {
        success: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'UNKNOWN_ACCEPT_REQUEST_ERROR',
      };
    }
  }

  async getPendingFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      // Reference to the user's friendRequestsReceived subcollection
      const requestsRef = collection(
        this.userCollection,
        userId,
        FriendRequestFields.RECEIVED,
      );

      // Execute the query
      const querySnapshot = await getDocs(requestsRef);

      // Map results into an array of objects
      const pendingRequests: FriendRequest[] = querySnapshot.docs.map(
        (doc) => ({
          ...doc.data(),
        }),
      ) as FriendRequest[];
      console.log('pendingRequests:', pendingRequests);

      return pendingRequests;
    } catch (error) {
      console.error('Error fetching pending friend requests:', error);
      return [];
    }
  }
  async getSentFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      // Reference to the user's friendRequestsSent subcollection
      const requestsRef = collection(
        this.userCollection,
        userId,
        FriendRequestFields.SENT,
      );

      // Execute the query
      const querySnapshot = await getDocs(requestsRef);

      // Map results into an array of objects
      const sentRequests: FriendRequest[] = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as FriendRequest[];
      console.log('sentRequests:', sentRequests);
      return sentRequests;
    } catch (error) {
      console.error('Error fetching sent friend requests:', error);
      return [];
    }
  }
}

export const friendsService = new FriendsService();
