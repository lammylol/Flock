// ramon jiang
// 1/29/25
// service for handling prayer CRUD operations with Firebase

import {
  serverTimestamp,
  FirebaseFirestoreTypes,
  getFirestore,
} from '@react-native-firebase/firestore';
import { FirestoreCollections } from '@/schema/firebaseCollections';
import {
  Prayer,
  PrayerPoint,
  CreatePrayerDTO,
  UpdatePrayerDTO,
  PrayerPointDTO,
} from '@/types/firebase';
import { User } from 'firebase/auth';
import { getAnalytics, logEvent } from '@react-native-firebase/analytics';

class PrayerService {
  async createPrayer(data: CreatePrayerDTO): Promise<string> {
    try {
      const flockDb = getFirestore();
      const prayersCollection = flockDb.collection(
        FirestoreCollections.PRAYERS,
      );

      const now = serverTimestamp();
      const docRef = await prayersCollection.add({
        ...data,
        createdAt: now,
        updatedAt: now,
      });

      // After the document is created, update it with the generated ID
      await docRef.update({ id: docRef.id });

      // If prayer is public, add to author's feed
      if (data.privacy === 'public') {
        const feedPrayerRef = flockDb
          .collection(FirestoreCollections.FEED)
          .doc(data.authorId)
          .collection(FirestoreCollections.PRAYERS)
          .doc(docRef.id);
        await feedPrayerRef.set({
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
      const flockDb = getFirestore();
      const prayersCollection = flockDb.collection(
        FirestoreCollections.PRAYERS,
      );
      const docRef = prayersCollection.doc(prayerId);
      const docSnap = await docRef.get();
      await logEvent(getAnalytics(), 'test - getPrayer');

      if (!docSnap.exists) return null;
      return this.convertDocToPrayer(docSnap);
    } catch (error) {
      console.error('Error getting prayer:', error);
      throw error;
    }
  }

  async getUserPrayers(userId: string): Promise<Prayer[]> {
    try {
      const flockDb = getFirestore();
      const prayersCollection = flockDb.collection(
        FirestoreCollections.PRAYERS,
      );
      const querySnapshot = await prayersCollection
        .where('authorId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

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
      const flockDb = getFirestore();
      const prayersCollection = flockDb.collection(
        FirestoreCollections.PRAYERS,
      );
      const now = serverTimestamp();
      const prayerRef = prayersCollection.doc(prayerId);

      await prayerRef.update({
        ...data,
        updatedAt: now,
      });

      // Update feed entry if prayer visibility changes
      if (data.privacy !== undefined) {
        const prayer = await this.getPrayer(prayerId);
        if (prayer) {
          const feedRef = flockDb
            .collection(FirestoreCollections.FEED)
            .doc(prayer.authorId)
            .collection(FirestoreCollections.PRAYERS)
            .doc(prayerId);

          if (data.privacy === 'public') {
            await feedRef.set({
              prayerId: prayerId,
              addedAt: now,
            });
          } else {
            await feedRef.delete();
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
      const flockDb = getFirestore();
      const prayersCollection = flockDb.collection(
        FirestoreCollections.PRAYERS,
      );
      // Delete the prayer document
      await prayersCollection.doc(prayerId).delete();

      // Remove from author's feed if it exists
      await flockDb
        .collection(FirestoreCollections.FEED)
        .doc(authorId)
        .collection(FirestoreCollections.PRAYERS)
        .doc(prayerId)
        .delete();

      // Delete all updates subcollection
      const updatesRef = prayersCollection.doc(prayerId).collection('updates');
      const updatesSnapshot = await updatesRef.get();

      const batch = flockDb.batch();
      updatesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error deleting prayer:', error);
      throw error;
    }
  }

  async addPrayerPoints(prayerPoints: PrayerPointDTO[]): Promise<string[]> {
    const now = serverTimestamp();

    try {
      const flockDb = getFirestore();
      const prayerPointsCollection = flockDb.collection(
        FirestoreCollections.PRAYERPOINTS,
      );
      const writePromises = prayerPoints.map(async (point) => {
        const docRef = await prayerPointsCollection.add({
          ...point,
          createdAt: now,
          updatedAt: now,
        });

        await docRef.update({ id: docRef.id });
        return docRef.id;
      });

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
      const flockDb = getFirestore();
      const prayerPointsCollection = flockDb.collection(
        FirestoreCollections.PRAYERPOINTS,
      );
      const querySnapshot = await prayerPointsCollection
        .where('prayerId', '==', prayerId)
        .where('authorId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get();

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
      const flockDb = getFirestore();
      const prayerPointsCollection = flockDb.collection(
        FirestoreCollections.PRAYERPOINTS,
      );
      const querySnapshot = await prayerPointsCollection
        .where('authorId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      if (querySnapshot.empty) return [];

      return querySnapshot.docs.map(
        (doc) => this.convertDocToPrayerPoint(doc) as PrayerPoint,
      );
    } catch (error) {
      console.error('Error getting prayer points:', error);
      throw error;
    }
  }

  private convertDocToPrayer(
    docSnap: FirebaseFirestoreTypes.DocumentSnapshot,
  ): Prayer {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      authorId: data?.authorId,
      authorName: data?.authorName,
      content: data?.content,
      privacy: data?.privacy,
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
      prayerTypes: data?.prayerTypes,
      prayerPoints: data?.prayerPoints,
    };
  }

  private convertDocToPrayerPoint(
    docSnap: FirebaseFirestoreTypes.DocumentSnapshot,
  ): PrayerPoint {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      authorId: data?.authorId,
      authorName: data?.authorName,
      title: data?.title,
      content: data?.content,
      status: data?.status,
      privacy: data?.privacy,
      createdAt: data?.createdAt.toDate(),
      updatedAt: data?.updatedAt.toDate(),
      prayerId: data?.prayerId,
      tags: data?.tags,
      prayerTypes: data?.prayerTypes,
      recipientId: data?.recipientId,
      recipientName: data?.recipientName,
      prayerUpdates: data?.prayerUpdates,
    };
  }
}

export const prayerService = new PrayerService();
