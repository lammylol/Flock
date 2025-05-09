import { FirestoreCollections } from '@/schema/firebaseCollections';
import {
  CreatePrayerTopicDTO,
  PrayerTopic,
  UpdatePrayerTopicDTO,
} from '@/types/firebase';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import {
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentData,
  Firestore,
  getDoc,
  getDocs,
  orderBy,
  query,
  QueryDocumentSnapshot,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firestoreSafety } from './firestoreSafety';
import { db } from '@/firebase/firebaseConfig';

export interface IPrayerTopicService {
  createPrayerTopic(data: CreatePrayerTopicDTO): Promise<string>;
  updatePrayerTopic(
    prayerTopicId: string,
    data: Partial<UpdatePrayerTopicDTO>,
  ): Promise<void>;
  deletePrayerTopic(prayerTopicId: string): Promise<void>;
  getUserPrayerTopics(userId: string): Promise<PrayerTopic[]>;
  getPrayerTopic(id: string): Promise<PrayerTopic | null>;
}

// ==== Prayer Topic CRUD ====
// Sharing is not supported for prayer topics yet.
class PrayerTopicService implements IPrayerTopicService {
  private prayerTopicsCollection: CollectionReference;
  constructor(db: Firestore) {
    this.prayerTopicsCollection = collection(
      db,
      FirestoreCollections.PRAYERTOPICS,
    );
  }

  async createPrayerTopic(data: CreatePrayerTopicDTO): Promise<string> {
    if (!data || !data.title) {
      console.error('Missing title in prayer topic');
      throw new Error('Missing title in prayer topic');
    }

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
      if (!prayerTopicId || !data) {
        console.error('Missing data for updating prayer topic');
        return;
      }
      const now = Timestamp.now();
      const prayerTopicRef = doc(this.prayerTopicsCollection, prayerTopicId);

      // Check if the prayer topic exists
      const exists = await firestoreSafety.checkIfDocumentExists(
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
      console.error('Error updating prayer topic:', error);
      throw error;
    }
  }

  async deletePrayerTopic(prayerTopicId: string): Promise<void> {
    try {
      // Check if the prayer topic exists
      const exists = await firestoreSafety.checkIfDocumentExists(
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

export const prayerTopicService = new PrayerTopicService(db);
