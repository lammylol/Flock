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
  Timestamp,
  writeBatch,
  setDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import {
  Prayer,
  PrayerPoint,
  CreatePrayerDTO,
  UpdatePrayerDTO,
  PrayerPointDTO,
} from '@/types/firebase';
import { FirestoreCollections } from '@/schema/firebaseCollections';
import { User } from 'firebase/auth';

class PrayerService {
  private prayersCollection = collection(db, FirestoreCollections.PRAYERS);
  private prayerPointsCollection = collection(
    db,
    FirestoreCollections.PRAYERPOINTS,
  );
  private feedsCollection = collection(db, FirestoreCollections.FEED);

  async createPrayer(data: CreatePrayerDTO): Promise<string> {
    try {
      const now = Timestamp.now();

      const docRef = await addDoc(this.prayersCollection, {
        ...data,
        createdAt: now,
        updatedAt: now,
      });

      // After the document is created, update it with the generated ID
      await updateDoc(docRef, { id: docRef.id });

      // If prayer is public, add to author's feed
      if (data.privacy === 'public') {
        const feedPrayerRef = doc(
          db,
          FirestoreCollections.FEED,
          data.authorId,
          FirestoreCollections.PRAYERS,
          docRef.id,
        );
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

  async getPrayer(prayerId: string): Promise<Prayer | null> {
    try {
      const docRef = doc(this.prayersCollection, prayerId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      return this.convertDocToPrayer(docSnap);
    } catch (error) {
      console.error('Error getting prayer:', error);
      throw error;
    }
  }

  async getUserPrayers(userId: string): Promise<Prayer[]> {
    try {
      const q = query(
        this.prayersCollection,
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(
        (doc) => this.convertDocToPrayer(doc) as Prayer,
      );
    } catch (error) {
      console.error('Error getting user prayers:', error);
      throw error;
    }
  }

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
          const feedRef = doc(
            db,
            FirestoreCollections.FEED,
            prayer.authorId,
            FirestoreCollections.PRAYERS,
            prayerId,
          );

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

  async deletePrayer(prayerId: string, authorId: string): Promise<void> {
    try {
      // Delete the prayer document
      await deleteDoc(doc(this.prayersCollection, prayerId));

      // Remove from author's feed if it exists
      await deleteDoc(
        doc(
          db,
          FirestoreCollections.FEED,
          authorId,
          FirestoreCollections.PRAYERS,
          prayerId,
        ),
      );

      // Delete all updates subcollection
      const updatesRef = collection(
        this.prayersCollection,
        prayerId,
        'updates',
      );
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

  // Add a list of prayer points, then return the list of prayer IDs.
  async addPrayerPoints(prayerPoints: PrayerPointDTO[]): Promise<string[]> {
    const now = Timestamp.now();

    try {
      // Map prayerPoints to Firestore write promises
      const writePromises = prayerPoints.map(async (point) => {
        const docRef = await addDoc(this.prayerPointsCollection, {
          ...point, // Use the actual prayer point data
          createdAt: now,
          updatedAt: now,
        });

        // After the document is created, update it with the generated ID
        await updateDoc(docRef, { id: docRef.id });

        return docRef.id;
      });

      // Wait for all Firestore writes to complete
      return await Promise.all(writePromises);
    } catch (error) {
      console.error('Error adding prayer points:', error);
      throw error;
    }
  }

  async getPrayerPoints(
    prayerId: string,
    user: User,
  ): Promise<PrayerPoint[] | null> {
    try {
      // Query for public OR user's own prayer points
      const q = query(
        this.prayerPointsCollection,
        where('prayerId', '==', prayerId),
        // where('privacy', '==', 'public'), // Fetch only public prayer points
        where('authorId', '==', user.uid), // OR fetch the user's own prayer points
        orderBy('createdAt', 'desc'),
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return null;

      return querySnapshot.docs.map(
        (doc) => this.convertDocToPrayerPoint(doc) as PrayerPoint,
      );
    } catch (error) {
      console.error('Error getting prayer points:', error);
      throw error;
    }
  }

  async getUserPrayerPoints(userId: string): Promise<PrayerPoint[]> {
    try {
      // Query for public OR user's own prayer points
      const q = query(
        this.prayerPointsCollection,
        // where('privacy', '==', 'public'), // Fetch only public prayer points
        where('authorId', '==', userId), // OR fetch the user's own prayer points
        orderBy('createdAt', 'desc'),
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return [];

      return querySnapshot.docs.map(
        (doc) => this.convertDocToPrayerPoint(doc) as PrayerPoint,
      );
    } catch (error) {
      console.error('Error getting prayer points:', error);
      throw error;
    }
  }

  //added for PrayerPoint CRUD
  async updatePrayerPoint(prayerPointId: string, data: Partial<PrayerPointDTO>): Promise<void> {
    try {
      const now = Timestamp.now();
      const prayerPointRef = doc(this.prayerPointsCollection, prayerPointId);
      
      await updateDoc(prayerPointRef, {
        ...data,
        updatedAt: now,
      });
      
      // If the prayer point's privacy status changes, we might need to handle feed visibility
      // Similar to how you handle it in updatePrayer()
      if (data.privacy !== undefined) {
        // Fetch the prayer point to get its prayerId
        const prayerPoint = await this.getPrayerPointById(prayerPointId);
        if (prayerPoint && prayerPoint.prayerId) {
          // You may want to update the prayer's updatedAt timestamp
          await updateDoc(doc(this.prayersCollection, prayerPoint.prayerId), {
            updatedAt: now,
          });
        }
      }
    } catch (error) {
      console.error('Error updating prayer point:', error);
      throw error;
    }
  }

  async deletePrayerPoint(prayerPointId: string): Promise<void> {
    try {
      // Get the prayer point to access its prayerId before deletion
      const prayerPointRef = doc(this.prayerPointsCollection, prayerPointId);
      const prayerPointSnap = await getDoc(prayerPointRef);
      
      if (!prayerPointSnap.exists()) {
        throw new Error('Prayer point not found');
      }
      
      const prayerPointData = prayerPointSnap.data();
      const prayerId = prayerPointData.prayerId;
      
      // Delete the prayer point document
      await deleteDoc(prayerPointRef);
      
      // Update the parent prayer's updatedAt timestamp
      if (prayerId) {
        await updateDoc(doc(this.prayersCollection, prayerId), {
          updatedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error deleting prayer point:', error);
      throw error;
    }
  }

  // Helper method to get a single prayer point by ID
  async getPrayerPointById(prayerPointId: string): Promise<PrayerPoint | null> {
    try {
      const docRef = doc(this.prayerPointsCollection, prayerPointId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) return null;
      
      return this.convertDocToPrayerPoint(docSnap);
    } catch (error) {
      console.error('Error getting prayer point:', error);
      throw error;
    }
  }

  private convertDocToPrayer(
    docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>,
  ): Prayer {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      authorId: data.authorId,
      authorName: data.authorName,
      content: data.content,
      privacy: data.privacy,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
      prayerTypes: data.prayerTypes,
      prayerPoints: data.prayerPoints,
    };
  }

  private convertDocToPrayerPoint(
    docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>,
  ): PrayerPoint {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      authorId: data.authorId,
      authorName: data.authorName,
      title: data.title,
      content: data.content,
      status: data.status,
      privacy: data.privacy,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
      prayerId: data.prayerId,
      tags: data.tags,
      prayerTypes: data.prayerTypes,
      recipientId: data.recipientId,
      recipientName: data.recipientName,
      prayerUpdates: data.prayerUpdates,
    };
  }

  // async addUpdate(
  //   prayerId: string,
  //   update: Omit<PrayerUpdate, 'id'>,
  // ): Promise<string> {
  //   try {
  //     const updatesRef = collection(
  //       this.prayersCollection,
  //       prayerId,
  //       'updates',
  //     );
  //     const updateDoc = await addDoc(updatesRef, {
  //       ...update,
  //     });

  //     // Update the prayer's updatedAt timestamp
  //     await updateDoc(doc(this.prayersCollection, prayerId), {
  //       updatedAt: Timestamp.now(),
  //     });

  //     return updateDoc.id;
  //   } catch (error) {
  //     console.error('Error adding prayer update:', error);
  //     throw error;
  //   }
  // }

  // async getPrayerUpdates(prayerId: string): Promise<PrayerUpdate[]> {
  //   try {
  //     const updatesRef = collection(
  //       this.prayersCollection,
  //       prayerId,
  //       'updates',
  //     );
  //     const q = query(updatesRef, orderBy('createdAt', 'desc'));
  //     const snapshot = await getDocs(q);

  //     return snapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     })) as PrayerUpdate[];
  //   } catch (error) {
  //     console.error('Error getting prayer updates:', error);
  //     throw error;
  //   }
  // }

  // // Real-time listeners
  // listenToPrayer(prayerId: string, callback: (prayer: Prayer | null) => void) {
  //   const docRef = doc(this.prayersCollection, prayerId);
  //   return onSnapshot(
  //     docRef,
  //     (doc) => {
  //       if (!doc.exists()) {
  //         callback(null);
  //         return;
  //       }
  //       callback({
  //         id: doc.id,
  //         ...doc.data(),
  //       } as Prayer);
  //     },
  //     (error) => {
  //       console.error('Error listening to prayer:', error);
  //     },
  //   );
  // }

  // listenToUserPrayers(userId: string, callback: (prayers: Prayer[]) => void) {
  //   const q = query(
  //     this.prayersCollection,
  //     where('authorId', '==', userId),
  //     orderBy('createdAt', 'desc'),
  //   );

  //   return onSnapshot(
  //     q,
  //     (snapshot) => {
  //       const prayers = snapshot.docs.map((doc) => ({
  //         id: doc.id,
  //         ...doc.data(),
  //       })) as Prayer[];
  //       callback(prayers);
  //     },
  //     (error) => {
  //       console.error('Error listening to user prayers:', error);
  //     },
  //   );
  // }
}

export const prayerService = new PrayerService();
