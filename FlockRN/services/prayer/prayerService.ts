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
  Firestore,
} from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import {
  Prayer,
  PrayerPoint,
  CreatePrayerDTO,
  UpdatePrayerDTO,
  PrayerTopic,
  PartialLinkedPrayerEntity,
} from '@/types/firebase';
import { EntityType } from '@/types/PrayerSubtypes';
import { FirestoreCollections } from '@/schema/firebaseCollections';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { getEntityType } from '@/types/typeGuards';

export interface IPrayerService {
  createPrayer(data: CreatePrayerDTO): Promise<string>;
  getPrayer(prayerId: string): Promise<Prayer | null>;
  getUserPrayers(userId: string): Promise<Prayer[]>;
  updatePrayer(prayerId: string, data: UpdatePrayerDTO): Promise<void>;
  deletePrayer(prayerId: string, authorId: string): Promise<void>;
  findRelatedPrayers(
    embedding: number[],
    userId: string,
    sourcePrayerId?: string,
    topK?: number,
  ): Promise<PartialLinkedPrayerEntity[] | []>;
}
class PrayerService implements IPrayerService {
  private prayersCollection: CollectionReference<DocumentData>;
  constructor(db: Firestore) {
    // Initialize the prayers collection reference
    this.prayersCollection = collection(db, FirestoreCollections.PRAYERS);
  }

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

  // ==== Searchable prayer =====

  // Search suggested prayer points
  async findRelatedPrayers(
    embedding: number[],
    userId: string,
    sourcePrayerId?: string,
    topK: number = 5,
  ): Promise<PartialLinkedPrayerEntity[] | []> {
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
        topK: topK,
        userId: userId,
      });
      const data = (
        result.data as {
          result: {
            id: string;
            similarity: number;
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
          similarity: number;
          prayerType: string;
          entityType: string;
        }) => {
          if (getEntityType(prayer.entityType) === 'prayerTopic') {
            return {
              id: prayer.id,
              title: prayer.title,
              entityType: prayer.entityType,
              similarity: prayer.similarity,
            } as Partial<PrayerTopic> & { similarity: number };
          } else {
            return {
              id: prayer.id,
              title: prayer.title,
              prayerType: prayer.prayerType,
              entityType: prayer.entityType,
              similarity: prayer.similarity,
            } as Partial<PrayerPoint> & { similarity: number };
          }
        },
      );
    } catch (error) {
      console.error('Error getting related prayer point:', error);
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
}

export const prayerService = new PrayerService(db);
