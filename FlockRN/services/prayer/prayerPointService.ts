import { db } from '@/firebase/firebaseConfig';
import { FirestoreCollections } from '@/schema/firebaseCollections';
import {
  CreatePrayerPointDTO,
  LinkedTopicInPrayerDTO,
  PrayerPoint,
  UpdatePrayerPointDTO,
} from '@/types/firebase';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { User } from 'firebase/auth';
import {
  addDoc,
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

export interface IPrayerPointsService {
  createPrayerPoint(
    data: CreatePrayerPointDTO,
  ): Promise<{ id: string; createdAt: Timestamp }>;
  updatePrayerPoint(
    prayerPointId: string,
    data: UpdatePrayerPointDTO,
  ): Promise<void>;
  addPrayerPoints(prayerPoints: CreatePrayerPointDTO[]): Promise<string[]>;
  deletePrayerPoint(
    prayerPointId: string,
    authorId: string,
  ): Promise<PrayerPoint>;
  getPrayerPoints(prayerId: string, user: User): Promise<PrayerPoint[] | null>;
  getUserPrayerPoints(userId: string): Promise<PrayerPoint[]>;
  getPrayerPointById(prayerPointId: string): Promise<PrayerPoint | null>;
}

interface FirestoreWrapper {
  doc: typeof doc;
  addDoc: typeof addDoc;
  updateDoc: typeof updateDoc;
  deleteDoc: typeof deleteDoc;
  setDoc: typeof setDoc;
  getTimestamp: () => Timestamp;
}

class PrayerPointsService implements IPrayerPointsService {
  private firestoreWrapper: FirestoreWrapper;
  private prayerPointsCollection: CollectionReference;

  constructor(
    db: Firestore,
    firestoreWrapper: FirestoreWrapper = {
      doc,
      addDoc,
      updateDoc,
      deleteDoc,
      setDoc,
      getTimestamp: () => Timestamp.now(),
    },
  ) {
    this.firestoreWrapper = firestoreWrapper;
    this.prayerPointsCollection = collection(
      db,
      FirestoreCollections.PRAYERPOINTS,
    );
  }

  async createPrayerPoint(
    data: CreatePrayerPointDTO,
  ): Promise<{ id: string; createdAt: Timestamp }> {
    try {
      const now = this.firestoreWrapper.getTimestamp();

      const docRef = await this.firestoreWrapper.addDoc(
        this.prayerPointsCollection,
        {
          ...data,
          createdAt: now,
          updatedAt: now,
          entityType: EntityType.PrayerPoint,
        },
      );

      await this.firestoreWrapper.updateDoc(docRef, { id: docRef.id });

      if (data.privacy === 'public') {
        const feedPrayerRef = this.firestoreWrapper.doc(
          db,
          FirestoreCollections.FEED,
          data.authorId,
          FirestoreCollections.PRAYERPOINTS,
          docRef.id,
        );
        await this.firestoreWrapper.setDoc(feedPrayerRef, {
          id: docRef.id,
          addedAt: now,
        });
      }

      return { id: docRef.id, createdAt: now };
    } catch (error) {
      console.error('Error creating prayer:', error);
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

  async updatePrayerPoint(
    prayerPointId: string,
    data: UpdatePrayerPointDTO,
  ): Promise<void> {
    try {
      if (!prayerPointId) {
        throw new Error('No prayerId provided for update');
      }
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
          await this.firestoreWrapper.deleteDoc(feedRef);
        }
      }
    } catch (error) {
      console.error('Error updating prayer point:', error);
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

  async deletePrayerPoint(
    prayerPointId: string,
    authorId: string,
  ): Promise<PrayerPoint> {
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
      return prayerPoint;
    } catch (error) {
      console.error('Error deleting prayer point:', error);
      throw error;
    }
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
      privacy: data.privacy,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
      prayerId: data.prayerId,
      tags: data.tags as PrayerType[],
      linkedTopics: data.linkedTopics as LinkedTopicInPrayerDTO[],
      prayerType: data.prayerType as PrayerType,
      recipientId: data.recipientId,
      recipientName: data.recipientName,
      contextAsEmbeddings: data.embedding,
      contextAsStrings: data.contextAsStrings,
      entityType: data.entityType as EntityType,
    };
  }
}

export const prayerPointService = new PrayerPointsService(db);
