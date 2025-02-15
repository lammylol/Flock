// ramon jiang
// 1/29/25
// service for handling prayer CRUD operations with Firebase

import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import {
  Prayer,
  CreatePrayerDTO,
  UpdatePrayerDTO,
  PrayerUpdate,
} from '@/types/firebase';

class PrayerService {
  private prayersCollection = collection(db, 'prayers');
  private feedsCollection = collection(db, 'feeds');

  // Create a prayer document in Firebase.
  async createPrayer(data: CreatePrayerDTO): Promise<string> {
    try {
      const now = Timestamp.now();

      const docRef = await addDoc(this.prayersCollection, {
        ...data,
        createdAt: now,
        updatedAt: now,
      });

      // If prayer is public, add to author's feed
      if (data.privacy === 'public') {
        const feedPrayerRef = doc(db, 'feeds', data.authorId, 'prayers', docRef.id);
        await setDoc(feedPrayerRef, {
          prayerId: docRef.id,
          addedAt: now,
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating prayer:', error);
      throw error;
    }
  }

  // Get a single prayer document from Firebase. If the document does not exist, return null. 
  async getPrayer(prayerId: string): Promise<Prayer | null> {
    try {
      const docRef = doc(this.prayersCollection, prayerId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Prayer;
    } catch (error) {
      console.error('Error getting prayer:', error);
      throw error;
    }
  }

  // Get all prayers that exist in Firebase for a specific user.
  async getUserPrayers(userId: string): Promise<Prayer[]> {
    try {
      const q = query(
        this.prayersCollection,
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
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
      const now = Timestamp.now();
      const prayerRef = doc(this.prayersCollection, prayerId);

      await updateDoc(prayerRef, {
        ...data,
        updatedAt: now,
      });

      // Update feed entry if prayer visibility changes
      if (data.privacy !== undefined) {
        const prayer = await this.getPrayer(prayerId);
        if (prayer) {
          const feedRef = doc(db, 'feeds', prayer.authorId, 'prayers', prayerId);

          if (data.privacy === 'public') {
            // Add to feed if making public
            await setDoc(feedRef, {
              prayerId: prayerId,
              addedAt: now,
            });
          } else {
            // Remove from feed if making private
            await deleteDoc(feedRef);
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
      await deleteDoc(doc(this.prayersCollection, prayerId));

      // Remove from author's feed if it exists
      await deleteDoc(doc(db, 'feeds', authorId, 'prayers', prayerId));

      // Delete all updates subcollection
      const updatesRef = collection(this.prayersCollection, prayerId, 'updates');
      const updatesSnapshot = await getDocs(updatesRef);

      const batch = writeBatch(db);
      updatesSnapshot.docs.forEach((doc) => {
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
      const updatesRef = collection(this.prayersCollection, prayerId, 'updates');
      const updateDoc = await addDoc(updatesRef, {
        ...update,
      });

      // Update the prayer's updatedAt timestamp
      await updateDoc(doc(this.prayersCollection, prayerId), {
        updatedAt: Timestamp.now(),
      });

      return updateDoc.id;
    } catch (error) {
      console.error('Error adding prayer update:', error);
      throw error;
    }
  }

  // Retrieve all prayer updates from Firebase for a specific prayer.
  async getPrayerUpdates(prayerId: string): Promise<PrayerUpdate[]> {
    try {
      const updatesRef = collection(this.prayersCollection, prayerId, 'updates');
      const q = query(updatesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

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
    const docRef = doc(this.prayersCollection, prayerId);
    return onSnapshot(
      docRef,
      (doc) => {
        if (!doc.exists()) {
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
      }
    );
  }

  /* Listen to all prayers that exist in Firebase for a specific user. This enables
  user to retrieve all new prayers in real-time without needing to refresh.*/
  listenToUserPrayers(userId: string, callback: (prayers: Prayer[]) => void) {
    const q = query(
      this.prayersCollection,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(
      q,
      (snapshot) => {
        const prayers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Prayer[];
        callback(prayers);
      },
      (error) => {
        console.error('Error listening to user prayers:', error);
      }
    );
  }
}

export const prayerService = new PrayerService();