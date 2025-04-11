// ramon jiang
// 1/29/25
// service for handling prayer CRUD operations with Firebase

import firestore, {
  FirebaseFirestoreTypes,
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

class PrayerService {
  private prayersCollection = firestore().collection(
    FirestoreCollections.PRAYERS,
  );
  private prayerPointsCollection = firestore().collection(
    FirestoreCollections.PRAYERPOINTS,
  );
  private feedsCollection = firestore().collection(FirestoreCollections.FEED);

  async createPrayer(data: CreatePrayerDTO): Promise<string> {
    try {
      const now = firestore.FieldValue.serverTimestamp();
      const docRef = await this.prayersCollection.add({
        ...data,
        createdAt: now,
        updatedAt: now,
      });

      // After the document is created, update it with the generated ID
      await docRef.update({ id: docRef.id });

      // If prayer is public, add to author's feed
      if (data.privacy === 'public') {
        const feedPrayerRef = firestore()
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
      const docRef = this.prayersCollection.doc(prayerId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) return null;
      return this.convertDocToPrayer(docSnap);
    } catch (error) {
      console.error('Error getting prayer:', error);
      throw error;
    }
  }

  async getUserPrayers(userId: string): Promise<Prayer[]> {
    try {
      const querySnapshot = await this.prayersCollection
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
      const now = firestore.FieldValue.serverTimestamp();
      const prayerRef = this.prayersCollection.doc(prayerId);

      await prayerRef.update({
        ...data,
        updatedAt: now,
      });

      // Update feed entry if prayer visibility changes
      if (data.privacy !== undefined) {
        const prayer = await this.getPrayer(prayerId);
        if (prayer) {
          const feedRef = firestore()
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
      // Delete the prayer document
      await this.prayersCollection.doc(prayerId).delete();

      // Remove from author's feed if it exists
      await firestore()
        .collection(FirestoreCollections.FEED)
        .doc(authorId)
        .collection(FirestoreCollections.PRAYERS)
        .doc(prayerId)
        .delete();

      // Delete all updates subcollection
      const updatesRef = this.prayersCollection
        .doc(prayerId)
        .collection('updates');
      const updatesSnapshot = await updatesRef.get();

      const batch = firestore().batch();
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
    const now = firestore.FieldValue.serverTimestamp();

    try {
      const writePromises = prayerPoints.map(async (point) => {
        const docRef = await this.prayerPointsCollection.add({
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
      const querySnapshot = await this.prayerPointsCollection
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
      const querySnapshot = await this.prayerPointsCollection
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
