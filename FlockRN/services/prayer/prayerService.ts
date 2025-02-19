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
import { Prayer, CreatePrayerDTO, UpdatePrayerDTO } from '@/types/firebase';
import { FirestoreCollections } from '@/schema/firebaseCollections';

class PrayerService {
  private prayersCollection = collection(db, FirestoreCollections.PRAYERS);
  private feedsCollection = collection(db, FirestoreCollections.FEED);

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

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Prayer;
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

  private convertDocToPrayer(
    docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>,
  ): Prayer {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      authorId: data.authorId,
      authorName: data.authorName,
      title: data.title,
      content: data.content,
      status: data.status,
      isPinned: data.isPinned,
      privacy: data.privacy,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
    };
  }

  private convertDocToPrayer(docSnap: any): Prayer {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      authorId: data.authorId,
      authorName: data.authorName,
      title: data.title,
      content: data.content,
      status: data.status,
      isPinned: data.isPinned,
      privacy: data.privacy,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
    };
  }
}

export const prayerService = new PrayerService();
