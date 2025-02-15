// ramon jiang
// 1/29/25
// service for handling prayer CRUD operations with Firebase

import firestore from '@react-native-firebase/firestore';
import {
  Prayer,
  CreatePrayerDTO,
  UpdatePrayerDTO,
  PrayerUpdate,
} from '@/types/firebase';

class PrayerService {
  private db = firestore();
  private prayersCollection = this.db.collection('prayers');
  private feedsCollection = this.db.collection('feeds');

  // Create a prayer document in Firebase.
  async createPrayer(data: CreatePrayerDTO): Promise<string> {
    try {
      const now = firestore.Timestamp.now();

      const prayerRef = this.prayersCollection.doc();
      await prayerRef.set({
        ...data,
        createdAt: now,
        updatedAt: now,
      });

      // If prayer is public, add to author's feed
      if (data.privacy === 'public') {
        await this.feedsCollection
          .doc(data.authorId)
          .collection('prayers')
          .doc(prayerRef.id)
          .set({
            prayerId: prayerRef.id,
            addedAt: now,
          });
      }

      return prayerRef.id;
    } catch (error) {
      console.error('Error creating prayer:', error);
      throw error;
    }
  }

  // Get a single prayer document from Firebase. If the document does not exist, return null. 
  async getPrayer(prayerId: string): Promise<Prayer | null> {
    try {
      const doc = await this.prayersCollection.doc(prayerId).get();

      if (!doc.exists) return null;

      return {
        id: doc.id,
        ...doc.data(),
      } as Prayer;
    } catch (error) {
      console.error('Error getting prayer:', error);
      throw error;
    }
  }

  // Get all prayers that exist in Firebase for a specific user.
  async getUserPrayers(userId: string): Promise<Prayer[]> {
    try {
      const snapshot = await this.prayersCollection
        .where('authorId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Prayer[];
    } catch (error) {
      console.error('Error getting user prayers:', error);
      throw error;
    }
  }

  // Edit a prayer document in Firebase.
  async updatePrayer(prayerId: string, data: UpdatePrayerDTO): Promise<void> {
    try {
      const now = firestore.Timestamp.now();

      await this.prayersCollection.doc(prayerId).update({
        ...data,
        updatedAt: now,
      });

      // Update feed entry if prayer visibility changes
      if (data.privacy !== undefined) {
        const prayer = await this.getPrayer(prayerId);
        if (prayer) {
          const feedRef = this.feedsCollection
            .doc(prayer.authorId)
            .collection('prayers')
            .doc(prayerId);

          if (data.privacy === 'public') {
            // Add to feed if making public
            await feedRef.set({
              prayerId: prayerId,
              addedAt: now,
            });
          } else {
            // Remove from feed if making private
            await feedRef.delete();
          }
        }
      }
    } catch (error) {
      console.error('Error updating prayer:', error);
      throw error;
    }
  }

  // Delete a prayer document from Firebase.
  async deletePrayer(prayerId: string, authorId: string): Promise<void> {
    try {
      // Delete the prayer document
      await this.prayersCollection.doc(prayerId).delete();

      // Remove from author's feed if it exists
      await this.feedsCollection
        .doc(authorId)
        .collection('prayers')
        .doc(prayerId)
        .delete();

      // Delete all updates subcollection
      const updates = await this.prayersCollection
        .doc(prayerId)
        .collection('updates')
        .get();

      const batch = this.db.batch();
      updates.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error deleting prayer:', error);
      throw error;
    }
  }

  // Add an update to a prayer document in Firebase. An update 
  // provides new status on an existing prayer.
  async addUpdate(
    prayerId: string,
    update: Omit<PrayerUpdate, 'id'>,
  ): Promise<string> {
    try {
      const updateRef = this.prayersCollection
        .doc(prayerId)
        .collection('updates')
        .doc();

      await updateRef.set({
        ...update,
        id: updateRef.id,
      });

      // Update the prayer's updatedAt timestamp
      await this.prayersCollection.doc(prayerId).update({
        updatedAt: firestore.Timestamp.now(),
      });

      return updateRef.id;
    } catch (error) {
      console.error('Error adding prayer update:', error);
      throw error;
    }
  }

  // Retrieve all prayer updates from Firebase for a specific prayer.
  async getPrayerUpdates(prayerId: string): Promise<PrayerUpdate[]> {
    try {
      const snapshot = await this.prayersCollection
        .doc(prayerId)
        .collection('updates')
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PrayerUpdate[];
    } catch (error) {
      console.error('Error getting prayer updates:', error);
      throw error;
    }
  }

  // -------- Real-time listeners ------------

  /* Listen to a specific prayer document in Firebase. If the document does not exist, return null.
  This enables the user to retrieve updates to a prayer in real-time without needing to 
  refresh to see changes.*/
  listenToPrayer(prayerId: string, callback: (prayer: Prayer | null) => void) {
    return this.prayersCollection.doc(prayerId).onSnapshot(
      (doc) => {
        if (!doc.exists) {
          callback(null);
          return;
        }
        callback({
          id: doc.id,
          ...doc.data(),
        } as Prayer);
      },
      (error) => {
        console.error('Error listening to prayer:', error);
      },
    );
  }

  /* Listen to all prayers that exist in Firebase for a specific user. This enables
  user to retrieve all new prayers in real-time without needing to refresh.*/
  listenToUserPrayers(userId: string, callback: (prayers: Prayer[]) => void) {
    return this.prayersCollection
      .where('authorId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const prayers = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Prayer[];
          callback(prayers);
        },
        (error) => {
          console.error('Error listening to user prayers:', error);
        },
      );
  }
}

export const prayerService = new PrayerService();
