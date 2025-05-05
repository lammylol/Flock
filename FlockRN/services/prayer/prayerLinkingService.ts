// services/prayerTopicCreationHandler.ts
import { db } from '@/firebase/firebaseConfig';
import {
  addDoc,
  collection,
  CollectionReference,
  deleteDoc,
  deleteField,
  doc,
  Firestore,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import OpenAiService from '@/services/ai/openAIService';
import {
  PrayerPoint,
  PrayerPointInPrayerTopicDTO,
  CreatePrayerTopicDTO,
  UpdatePrayerTopicDTO,
  LinkedPrayerEntity,
  LinkedTopicInPrayerDTO,
  FlatPrayerTopicDTO,
  PrayerTopic,
} from '@/types/firebase';
import { isPrayerTopic } from '@/types/typeGuards';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { User } from 'firebase/auth';
import { prayerPointService } from './prayerPointService';
import { prayerTopicService } from './prayerTopicService';
import { FirestoreCollections } from '@/schema/firebaseCollections';

export interface IPrayerLinkingService {
  loadOriginPrayer(
    originPrayer: LinkedPrayerEntity,
  ): Promise<LinkedPrayerEntity | null>;
  getJourney(
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
  ): PrayerPointInPrayerTopicDTO[];
  updatePrayerTopicWithJourney(
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
    topicId: string,
  ): Promise<void>;
  getDistinctPrayerTypes(
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
  ): PrayerType[];
  setContextAsStringsAndGetEmbeddings(
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
  ): Promise<{ contextAsStrings: string; contextAsEmbeddings: number[] }>;
  getPrayerTopicDTO({
    prayerPoint,
    selectedPrayer,
    topicTitle,
    user,
  }: {
    prayerPoint: PrayerPoint;
    selectedPrayer: LinkedPrayerEntity;
    topicTitle?: string;
    user: User;
  }): Promise<CreatePrayerTopicDTO | UpdatePrayerTopicDTO | undefined>;
  removeEmbeddingLocally(prayerPoint: PrayerPoint): PrayerPoint;
  removeEmbeddingFromFirebase(
    selectedPrayer: LinkedPrayerEntity,
  ): Promise<void>;
  updateLinkedPrayerTopic(
    prayerPoint: PrayerPoint,
    topicToModify?: LinkedTopicInPrayerDTO,
    options?: { remove?: boolean },
  ): Promise<PrayerPoint>;
}

interface FirestoreWrapper {
  doc: typeof doc;
  addDoc: typeof addDoc;
  updateDoc: typeof updateDoc;
  deleteDoc: typeof deleteDoc;
  setDoc: typeof setDoc;
  getTimestamp: () => Timestamp;
}

class PrayerLinkingService implements IPrayerLinkingService {
  private firestoreWrapper: FirestoreWrapper;
  private prayerPointsCollection: CollectionReference;
  private prayerTopicsCollection: CollectionReference;

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
    this.prayerTopicsCollection = collection(
      db,
      FirestoreCollections.PRAYERTOPICS,
    );
  }

  maxCharactersPerPrayerContext = 250; // or whatever your constant is
  openAiService = OpenAiService.getInstance();

  // Load the origin prayer (either prayer point or prayer topic)
  loadOriginPrayer = async (
    originPrayer: LinkedPrayerEntity,
  ): Promise<LinkedPrayerEntity | null> => {
    try {
      let fetchedPrayer = null;
      switch (originPrayer?.entityType) {
        case EntityType.PrayerPoint:
          fetchedPrayer = await prayerPointService.getPrayerPoint(
            originPrayer.id as PrayerPoint['id'],
          );
          break;
        case EntityType.PrayerTopic:
          fetchedPrayer = await prayerTopicService.getPrayerTopic(
            originPrayer.id as PrayerTopic['id'],
          );
          break;
        default:
          console.warn('Unknown entityType or originPrayer is null');
          return null;
      }
      return fetchedPrayer;
    } catch (error) {
      console.error('Error fetching prayer point or topic:', error);
      return null;
    }
  };

  getJourney = (
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
  ): PrayerPointInPrayerTopicDTO[] => {
    const normalizeDate = (input: string | number | Date): Date => {
      const date = new Date(input ?? Date.now());
      return isNaN(date.getTime()) ? new Date() : date;
    };
    const toDTO = (
      p: PrayerPointInPrayerTopicDTO,
    ): PrayerPointInPrayerTopicDTO => ({
      id: p.id,
      prayerType: p.prayerType ?? 'request',
      title: p.title,
      content: p.content,
      createdAt: normalizeDate(p.createdAt),
      authorId: p.authorId ?? 'unknown',
      authorName: p.authorName,
      recipientName: p.recipientName,
    });

    const normalizeJourney = (): PrayerPointInPrayerTopicDTO[] => {
      if (isPrayerTopic(originPrayer) && Array.isArray(originPrayer.journey)) {
        return (originPrayer.journey as PrayerPointInPrayerTopicDTO[]).map(
          toDTO,
        );
      }
      return [toDTO(originPrayer as PrayerPointInPrayerTopicDTO)];
    };

    const journey = [...normalizeJourney(), toDTO(prayerPoint)];
    console.log('Journey:', journey);

    const deduped = Array.from(new Map(journey.map((j) => [j.id, j])).values());

    return deduped.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  };

  updatePrayerTopicWithJourney = async (
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    topicId: string,
  ) => {
    const journey = this.getJourney(prayerPoint, originPrayer);
    if (!journey || journey.length === 0) {
      console.warn('Empty journey; removing field');
      return await prayerTopicService.updatePrayerTopic(topicId, {
        journey: deleteField(),
      });
    }

    return await prayerTopicService.updatePrayerTopic(topicId, {
      journey,
    });
  };

  getDistinctPrayerTypes = (
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
  ): PrayerType[] => {
    const types = new Set<PrayerType>();

    if (
      isPrayerTopic(selectedPrayer) &&
      Array.isArray(selectedPrayer.prayerTypes)
    ) {
      selectedPrayer.prayerTypes.forEach((type) => types.add(type));
    }

    if (prayerPoint.prayerType) {
      types.add(prayerPoint.prayerType);
    }

    return Array.from(types);
  };

  setContextAsStringsAndGetEmbeddings = async (
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
  ): Promise<{ contextAsStrings: string; contextAsEmbeddings: number[] }> => {
    // There is no slice on (selectedPrayer) original content, just the new prayer point.
    // this is for 2 reasons: 1) keep original prayer point intact and
    // to lean more heavily on it when there are few topics. 2) if linking to a prayer topic,
    // we need the full content.
    const newContent = `${prayerPoint.title}, ${prayerPoint.content.slice(0, this.maxCharactersPerPrayerContext)}`;
    const oldContent = isPrayerTopic(selectedPrayer)
      ? `${selectedPrayer.contextAsStrings}`
      : `${selectedPrayer.title} ${selectedPrayer.content}`.trim();

    const contextAsStrings = [oldContent, newContent].join(', ').trim();

    try {
      const embeddings =
        await this.openAiService.getVectorEmbeddings(contextAsStrings);

      if (!embeddings || embeddings.length === 0) {
        console.error('Failed to generate embeddings');
        return {
          contextAsStrings: '',
          contextAsEmbeddings: [],
        };
      }

      return {
        contextAsStrings,
        contextAsEmbeddings: embeddings,
      };
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw error;
    }
  };

  // This function handles all the logic for prayer topics when linking
  // either prayer point to prayer point or prayer point to an existing prayer topic.
  getPrayerTopicDTO = async ({
    prayerPoint,
    selectedPrayer,
    topicTitle,
    user,
  }: {
    prayerPoint: PrayerPoint;
    selectedPrayer: LinkedPrayerEntity;
    topicTitle?: string;
    user: User;
  }) => {
    if (!user.uid) {
      console.error('User ID is not available');
      return;
    }

    const prayerTypes = this.getDistinctPrayerTypes(
      prayerPoint,
      selectedPrayer,
    );

    if (!user?.uid) {
      console.error('Cannot add topic. User ID is not available');
      return;
    }

    const content = `Latest ${prayerPoint.prayerType.trim()}: ${prayerPoint.title!.trim()} `;

    // Get context strings + embeddings
    const { contextAsStrings, contextAsEmbeddings } =
      await this.setContextAsStringsAndGetEmbeddings(
        prayerPoint,
        selectedPrayer,
      );

    if (!contextAsStrings || !contextAsEmbeddings) {
      console.error('Missing context or embeddings');
      return;
    }

    const sharedFields = {
      id: selectedPrayer.id,
      content: content,
      contextAsStrings: contextAsStrings,
      contextAsEmbeddings: contextAsEmbeddings,
      prayerTypes: prayerTypes,
    };

    switch (selectedPrayer.entityType) {
      case EntityType.PrayerTopic: {
        const updateTopicData: UpdatePrayerTopicDTO = {
          ...sharedFields,
          title: selectedPrayer.title,
          authorName: selectedPrayer.authorName,
          authorId: selectedPrayer.authorId,
        };
        return updateTopicData;
      }

      case EntityType.PrayerPoint:
      default: {
        const createTopicData: CreatePrayerTopicDTO = {
          ...sharedFields,
          title: topicTitle,
          authorName: user.displayName || 'Unknown',
          authorId: user.uid,
          status: 'open',
          privacy: 'private',
          recipientName: 'User',
          recipientId: 'Unknown',
        };
        return createTopicData;
      }
    }
  };

  removeEmbeddingLocally = (prayerPoint: PrayerPoint): PrayerPoint => {
    return {
      ...prayerPoint,
      embedding: undefined,
    };
  };

  removeEmbeddingFromFirebase = async (selectedPrayer: LinkedPrayerEntity) => {
    if (!selectedPrayer.id) {
      console.error('Missing id for removing embedding');
      return;
    }
    if (selectedPrayer.entityType === EntityType.PrayerPoint) {
      await prayerPointService.updatePrayerPoint(selectedPrayer.id, {
        embedding: deleteField(),
      });
    }
  };

  // Remove embeddings from Firebase and locally
  removePrayerPointEmbeddings = async (originPrayer: PrayerPoint) => {
    if (originPrayer.entityType === EntityType.PrayerPoint) {
      await this.removeEmbeddingFromFirebase(originPrayer);
    }
    return this.removeEmbeddingLocally(originPrayer);
  };

  // This function updates the linked topics in a prayer point.
  updateLinkedPrayerTopic = async (
    prayerPoint: PrayerPoint,
    topicToModify?: LinkedTopicInPrayerDTO,
    options?: { remove?: boolean },
  ): Promise<PrayerPoint> => {
    const existingTopics: LinkedTopicInPrayerDTO[] = Array.isArray(
      prayerPoint.linkedTopic,
    )
      ? (prayerPoint.linkedTopic as LinkedTopicInPrayerDTO[])
      : [];

    // Removing a topic
    if (options?.remove) {
      if (!topicToModify?.id) {
        throw new Error('topicToModify.id is required when removing a topic');
      }

      const updatedTopics = existingTopics.filter(
        (t) => t.id !== topicToModify.id,
      );

      return {
        ...prayerPoint,
        linkedTopic: updatedTopics.length > 0 ? updatedTopics : undefined,
      };
    }

    // Adding a topic
    if (!topicToModify) {
      throw new Error('topicToModify is required when adding a topic');
    }

    const mergedLinkedTopics = Array.from(
      new Map(
        [...existingTopics, topicToModify].map((topic) => [topic.id, topic]),
      ).values(),
    );

    return {
      ...prayerPoint,
      linkedTopic: mergedLinkedTopics,
    };
  };

  // Update prayer point with a linked topic
  updatePrayerPointWithLinkedTopic = async (
    prayerPoint: PrayerPoint,
    topicToModify: LinkedTopicInPrayerDTO,
    isExistingPrayerPoint?: boolean,
  ) => {
    const updated = await this.updateLinkedPrayerTopic(
      prayerPoint,
      topicToModify,
    );
    if (isExistingPrayerPoint) {
      if (!prayerPoint.id) {
        console.error(
          'UpdatePrayerPointWithLinkedTopic: Missing prayer point ID',
        );
        return;
      }
      await prayerPointService.updatePrayerPoint(prayerPoint.id, {
        linkedTopic: updated.linkedTopic,
      });
    }
    return updated;
  };

  getLinkedPrayerTopicFromDTO = async (topicDTO: FlatPrayerTopicDTO) => {
    const linkedTopic = {
      id: 'id' in topicDTO ? topicDTO.id : undefined,
      title: topicDTO.title,
      content: topicDTO.content,
    };

    return linkedTopic;
  };
}

export const prayerLinkingService = new PrayerLinkingService(db);
