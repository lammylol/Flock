import { CollectionReference, doc, getDoc } from 'firebase/firestore';

export interface FirestoreSafetyInterface {
  checkIfDocumentExists(
    collectionName: CollectionReference,
    documentId: string,
  ): Promise<boolean>;
}

class FirestoreSafety implements FirestoreSafetyInterface {
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
}

export const firestoreSafety = new FirestoreSafety();
