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
  setDoc,
  QueryDocumentSnapshot,
  DocumentData,
  CollectionReference,
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import {
  Prayer,
  PrayerPoint,
  CreatePrayerDTO,
  UpdatePrayerDTO,
  CreatePrayerPointDTO,
  UpdatePrayerPointDTO,
  PrayerTopic,
  CreatePrayerTopicDTO,
  UpdatePrayerTopicDTO,
  LinkedTopicInPrayerDTO,
} from '@/types/firebase';
import { PrayerType, EntityType } from '@/types/PrayerSubtypes';
import { FirestoreCollections } from '@/schema/firebaseCollections';
import { User } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { getEntityType } from '@/types/typeGuards';

class PrayerService {
  private prayersCollection = collection(db, FirestoreCollections.PRAYERS);
  private prayerPointsCollection = collection(
    db,
    FirestoreCollections.PRAYERPOINTS,
  );
  private feedsCollection = collection(db, FirestoreCollections.FEED);
  private prayerTopicsCollection = collection(
    db,
    FirestoreCollections.PRAYERTOPICS,
  );

  // ===== Prayer CRUD operations =====
  async createPrayer(data: CreatePrayerDTO): Promise<string> {
    try {
      const now = Timestamp.now();

      const docRef = await addDoc(this.prayersCollection, {
        ...data,
        createdAt: now,
        updatedAt: now,
        entityType: EntityType.Prayer,
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
    } catch (error) {
      console.error('Error deleting prayer:', error);
      throw error;
    }
  }

  // Add a list of prayer points, then return the list of prayer IDs.
  async addPrayerPoints(
    prayerPoints: CreatePrayerPointDTO[],
  ): Promise<string[]> {
    const now = Timestamp.now();

    try {
      // Map prayerPoints to Firestore write promises
      const writePromises = prayerPoints.map(async (point) => {
        const docRef = await addDoc(this.prayerPointsCollection, {
          ...point, // Use the actual prayer point data
          createdAt: now,
          updatedAt: now,
          entityType: EntityType.PrayerPoint,
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

  // ===== Prayer Point CRUD operations =====

  async createPrayerPoint(data: CreatePrayerPointDTO): Promise<string> {
    try {
      const now = Timestamp.now();

      const docRef = await addDoc(this.prayerPointsCollection, {
        ...data,
        createdAt: now,
        updatedAt: now,
        entityType: EntityType.PrayerPoint,
      });

      // After the document is created, update it with the generated ID
      await updateDoc(docRef, { id: docRef.id });

      // If prayer is public, add to author's feed
      if (data.privacy === 'public') {
        const feedPrayerRef = doc(
          db,
          FirestoreCollections.FEED,
          data.authorId,
          FirestoreCollections.PRAYERPOINTS,
          docRef.id,
        );
        await setDoc(feedPrayerRef, {
          id: docRef.id,
          addedAt: now,
        });
      }

      return docRef.id;
    } catch (error) {
      console.error('Error creating prayer:', error);
      throw error;
    }
  }

  async updatePrayerPoint(
    prayerPointId: string,
    data: UpdatePrayerPointDTO,
  ): Promise<void> {
    try {
      const now = Timestamp.now();
      const prayerPointRef = doc(this.prayerPointsCollection, prayerPointId);

      // We should reconsider this if needed. Sounds like an excessive read.
      // Get the current prayer point to check for privacy changes
      const currentPrayerPoint = await this.getPrayerPoint(prayerPointId);
      if (!currentPrayerPoint) {
        throw new Error('Prayer point not found');
      }

      // Update the prayer point
      await updateDoc(prayerPointRef, {
        ...data,
        updatedAt: now,
      });

      // Handle privacy changes if applicable (from public to private or vice versa)
      if (
        data.privacy !== undefined &&
        data.privacy !== currentPrayerPoint.privacy
      ) {
        const feedRef = doc(
          db,
          FirestoreCollections.FEED,
          currentPrayerPoint.authorId,
          FirestoreCollections.PRAYERPOINTS,
          prayerPointId,
        );

        if (data.privacy === 'public') {
          // Add to feed if making public
          await setDoc(feedRef, {
            id: prayerPointId,
            addedAt: now,
          });
        } else if (currentPrayerPoint.privacy === 'public') {
          // Remove from feed if making private (and it was previously public)
          await deleteDoc(feedRef);
        }
      }
    } catch (error) {
      console.error('Error updating prayer point:', error);
      throw error;
    }
  }

  async deletePrayerPoint(
    prayerPointId: string,
    authorId: string,
  ): Promise<void> {
    try {
      // Excessive read - need to refactor and reconsider this.
      // First get the prayer point to check if it exists
      const prayerPoint = await this.getPrayerPoint(prayerPointId);
      if (!prayerPoint) {
        throw new Error('Prayer point not found');
      }

      // Check if the user is the author (this is also enforced by Firebase rules)
      if (prayerPoint.authorId !== authorId) {
        throw new Error('Unauthorized to delete this prayer point');
      }

      // Delete the prayer point document
      await deleteDoc(doc(this.prayerPointsCollection, prayerPointId));

      // Remove from author's feed if it was public
      if (prayerPoint.privacy === 'public') {
        await deleteDoc(
          doc(
            db,
            FirestoreCollections.FEED,
            authorId,
            FirestoreCollections.PRAYERPOINTS,
            prayerPointId,
          ),
        );
      }

      // If this prayer point is associated with a prayer, update that prayer
      if (prayerPoint.prayerId) {
        // Handle the case where prayerId could be a string or an array of strings
        const prayerIds = Array.isArray(prayerPoint.prayerId)
          ? prayerPoint.prayerId
          : [prayerPoint.prayerId];

        // Update each associated prayer
        for (const id of prayerIds) {
          const prayer = await this.getPrayer(id);
          if (
            prayer &&
            prayer.prayerPoints &&
            prayer.prayerPoints.includes(prayerPointId)
          ) {
            // Remove this prayer point ID from the prayer's prayerPoints array
            const updatedPrayerPoints = prayer.prayerPoints.filter(
              (pid) => pid !== prayerPointId,
            );
            await this.updatePrayer(id, {
              prayerPoints: updatedPrayerPoints,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error deleting prayer point:', error);
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

  async getPrayerPoint(prayerPointId: string): Promise<PrayerPoint | null> {
    try {
      const docRef = doc(this.prayerPointsCollection, prayerPointId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      return this.convertDocToPrayerPoint(docSnap);
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

  // ==== Prayer Topic CRUD ====
  // Sharing is not supported for prayer topics yet.

  async createPrayerTopic(data: CreatePrayerTopicDTO): Promise<string> {
    try {
      const now = Timestamp.now();

      const newDocRef = doc(this.prayerTopicsCollection);
      await setDoc(newDocRef, {
        ...data,
        id: newDocRef.id,
        createdAt: now,
        updatedAt: now,
        entityType: EntityType.PrayerTopic,
      });
      return newDocRef.id;
    } catch (error) {
      console.error('Error creating prayer topic:', error);
      throw error;
    }
  }

  //added for PrayerPoint CRUD
  async updatePrayerTopic(
    prayerTopicId: string,
    data: Partial<UpdatePrayerTopicDTO>,
  ): Promise<void> {
    try {
      const now = Timestamp.now();
      const prayerTopicRef = doc(this.prayerTopicsCollection, prayerTopicId);

      // Check if the prayer topic exists
      const exists = await this.checkIfDocumentExists(
        this.prayerTopicsCollection,
        prayerTopicId,
      );
      if (!exists) {
        throw new Error('Prayer topic not found');
      }

      await updateDoc(prayerTopicRef, {
        ...data,
        updatedAt: now,
      });

      // Placeholder to add to another feed later.
    } catch (error) {
      console.error('Error updating prayer point:', error);
      throw error;
    }
  }

  async deletePrayerTopic(prayerTopicId: string): Promise<void> {
    try {
      // Check if the prayer topic exists
      const exists = await this.checkIfDocumentExists(
        this.prayerTopicsCollection,
        prayerTopicId,
      );
      if (!exists) {
        throw new Error('Prayer topic not found');
      }

      // Delete the prayer topic document
      await deleteDoc(doc(this.prayerTopicsCollection, prayerTopicId));

      // Placeholder to remove from author's feed later.
    } catch (error) {
      console.error('Error deleting prayer topic:', error);
      throw error;
    }
  }

  async getUserPrayerTopics(userId: string): Promise<PrayerTopic[]> {
    try {
      const q = query(
        this.prayerTopicsCollection,
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return [];
      return querySnapshot.docs.map(
        (doc) => this.convertDocToPrayerTopic(doc) as PrayerTopic,
      );
    } catch (error) {
      console.error('Error getting user prayer topics:', error);
      throw error;
    }
  }

  async getPrayerTopic(id: string): Promise<PrayerTopic | null> {
    try {
      const docRef = doc(this.prayerTopicsCollection, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      return this.convertDocToPrayerTopic(docSnap);
    } catch (error) {
      console.error('Error getting prayer points:', error);
      throw error;
    }
  }

  // ==== Searchable prayer =====

  // Search suggested prayer points
  async findRelatedPrayers(
    embedding: number[],
    userId: string,
    sourcePrayerId?: string,
  ): Promise<(Partial<PrayerPoint> | Partial<PrayerTopic>)[] | []> {
    try {
      const functions = getFunctions(getApp());
      // Ensure the function is deployed and callable
      const findSimilarPrayers = httpsCallable(
        functions,
        'findSimilarPrayersV2',
      );
      const result = await findSimilarPrayers({
        ...(sourcePrayerId && { sourcePrayerId }),
        queryEmbedding: embedding,
        topK: 5,
        userId: userId,
      });
      const data = (
        result.data as {
          result: {
            id: string;
            similarity: string;
            title: string;
            prayerType: string;
            entityType: string;
          }[];
        }
      )?.result;

      return data.map(
        (prayer: {
          id: string;
          title: string;
          prayerType: string;
          entityType: string;
        }) => {
          if (getEntityType(prayer.entityType) === 'prayerTopic') {
            return {
              id: prayer.id,
              title: prayer.title,
              entityType: prayer.entityType,
            } as Partial<PrayerTopic>;
          } else {
            return {
              id: prayer.id,
              title: prayer.title,
              prayerType: prayer.prayerType,
              entityType: prayer.entityType,
            } as Partial<PrayerPoint>;
          }
        },
      );
    } catch (error) {
      console.error('Error getting prayer point:', error);
      return []; // Return an empty array in case of an error
    }
  }

  async checkIfDocumentExists(
    collectionName: CollectionReference,
    documentId: string,
  ): Promise<boolean> {
    try {
      const docRef = doc(collectionName, documentId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error checking document existence:', error);
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
      prayerPoints: data.prayerPoints,
      entityType: data.entityType as EntityType,
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
      linkedTopic: data.linkedTopic as LinkedTopicInPrayerDTO[],
      prayerType: data.prayerType as PrayerType,
      recipientId: data.recipientId,
      recipientName: data.recipientName,
      embedding: data.embedding,
      entityType: data.entityType as EntityType,
    };
  }

  private convertDocToPrayerTopic(
    docSnap: QueryDocumentSnapshot<DocumentData, DocumentData>,
  ): PrayerTopic {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      authorId: data.authorId,
      authorName: data.authorName,
      title: data.title,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
      prayerTypes: data.prayerTypes as PrayerType[],
      status: data.status,
      privacy: data.privacy,
      recipientId: data.recipientId,
      recipientName: data.recipientName,
      journey: data.journey,
      contextAsStrings: data.contextAsStrings,
      contextAsEmbeddings: data.contextAsEmbeddings,
      entityType: data.entityType as EntityType,
      content: data.content,
    };
  }
}

export const prayerService = new PrayerService();
