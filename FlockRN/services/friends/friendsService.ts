import {
  arrayUnion,
  getFirestore,
  serverTimestamp,
} from '@react-native-firebase/firestore'; // Using react-native-firebase firestore
import {
  FirestoreCollections,
  FriendRequestFields,
} from '@/schema/firebaseCollections';
import {
  FriendRequest,
  ServiceResponse,
  UserProfileResponse,
} from '@/types/firebase';

class FriendsService {
  async searchUsers(searchTerm: string): Promise<UserProfileResponse[]> {
    try {
      const flockDb = getFirestore();
      const usersCollection = flockDb.collection(FirestoreCollections.USERS);
      const lowerSearchTerm = searchTerm.toLowerCase();

      // Create three queries, one for each field
      const queries = [
        'normalizedUsername',
        'normalizedFirstName',
        'normalizedLastName',
      ].map((field) =>
        usersCollection
          .where(field, '>=', lowerSearchTerm)
          .where(field, '<=', lowerSearchTerm + '\uf8ff'),
      );

      const snapshots = await Promise.all(queries.map((q) => q.get()));

      // Deduplicate results
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
      const flockDb = getFirestore();
      const usersCollection = flockDb.collection(FirestoreCollections.USERS);
      const sendingUserId = sendingUser.id;
      const receivingUserId = receivingUser.id;

      const senderSentRef = usersCollection
        .doc(sendingUserId)
        .collection(FriendRequestFields.SENT)
        .doc(receivingUserId);
      const receiverReceivedRef = usersCollection
        .doc(receivingUserId)
        .collection(FriendRequestFields.RECEIVED)
        .doc(sendingUserId);

      const batch = flockDb.batch();
      batch.set(
        senderSentRef,
        {
          userId: receivingUserId,
          username: receivingUser.username,
          displayName: receivingUser.displayName,
          status: 'pending',
          timestamp: serverTimestamp(),
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
          timestamp: serverTimestamp(),
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
      const flockDb = getFirestore();
      const usersCollection = flockDb.collection(FirestoreCollections.USERS);
      const senderFriendRequestRef = usersCollection
        .doc(receiverId)
        .collection(FriendRequestFields.SENT)
        .doc(senderId);
      const receiverFriendRequestRef = usersCollection
        .doc(senderId)
        .collection(FriendRequestFields.RECEIVED)
        .doc(receiverId);

      // References to the user documents
      const senderUserRef = usersCollection.doc(senderId);
      const receiverUserRef = usersCollection.doc(receiverId);

      // Get the user details for sender and receiver
      const senderDoc = await senderUserRef.get();
      const receiverDoc = await receiverUserRef.get();

      const senderData = senderDoc.data() as UserProfileResponse;
      const receiverData = receiverDoc.data() as UserProfileResponse;

      const senderFriend = {
        userId: senderId,
        displayName: senderData?.displayName || '',
        userName: senderData?.username || '',
        createdAt: serverTimestamp(),
      };

      const receiverFriend = {
        userId: receiverId,
        displayName: receiverData?.displayName || '',
        userName: receiverData?.username || '',
        createdAt: serverTimestamp(),
      };

      // Create a batch write to perform all operations atomically
      const batch = flockDb.batch();

      // Delete the friend request documents
      batch.delete(senderFriendRequestRef);
      batch.delete(receiverFriendRequestRef);

      // Add both users to each other's friends array
      batch.update(senderUserRef, {
        friends: arrayUnion(receiverFriend),
      });
      batch.update(receiverUserRef, {
        friends: arrayUnion(senderFriend),
      });

      // Commit the batch
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error accepting friend request:', error);
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
      const flockDb = getFirestore();
      const usersCollection = flockDb.collection(FirestoreCollections.USERS);
      // Reference to the user's friendRequestsReceived subcollection
      const requestsRef = usersCollection
        .doc(userId)
        .collection(FriendRequestFields.RECEIVED);

      // Execute the query
      const querySnapshot = await requestsRef.get();

      // Map results into an array of objects
      const pendingRequests: FriendRequest[] = querySnapshot.docs.map(
        (doc) => ({
          ...doc.data(),
        }),
      ) as FriendRequest[];

      return pendingRequests;
    } catch (error) {
      console.error('Error fetching pending friend requests:', error);
      return [];
    }
  }

  async getSentFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const flockDb = getFirestore();
      const usersCollection = flockDb.collection(FirestoreCollections.USERS);
      // Reference to the user's friendRequestsSent subcollection
      const requestsRef = usersCollection
        .doc(userId)
        .collection(FriendRequestFields.SENT);

      // Execute the query
      const querySnapshot = await requestsRef.get();

      // Map results into an array of objects
      const sentRequests: FriendRequest[] = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as FriendRequest[];
      return sentRequests;
    } catch (error) {
      console.error('Error fetching sent friend requests:', error);
      return [];
    }
  }
}

export const friendsService = new FriendsService();
