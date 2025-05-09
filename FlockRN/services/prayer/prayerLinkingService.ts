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
import { isPrayerTopic, isValidCreateDTO, isValidUpdateDTO } from '@/types/typeGuards';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { User } from 'firebase/auth';
import { prayerPointService } from './prayerPointService';
import { prayerTopicService } from './prayerTopicService';
import { FirestoreCollections } from '@/schema/firebaseCollections';

export interface IPrayerLinkingService {
  loadPrayer(
    originPrayer: LinkedPrayerEntity,
  ): Promise<LinkedPrayerEntity | null>;
  getJourney(
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
  ): PrayerPointInPrayerTopicDTO[];
  updatePrayerTopicWithJourneyAndGetTopicEmbeddings(
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
    topicId: string,
  ): Promise<void>;
  getDistinctPrayerTypes(
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
  ): PrayerType[];
  linkToExistingTopic(
    originTopic: PrayerTopic,
    topicDTO: FlatPrayerTopicDTO,
    isNewPrayerPoint: boolean,
    prayerPoint: PrayerPoint,
  ): Promise<PrayerPoint>;
  linkToNewTopic(
    originPrayerPoint: PrayerPoint,
    topicDTO: FlatPrayerTopicDTO,
    isNewPrayerPoint: boolean,
    prayerPoint: PrayerPoint,
  ): Promise<{
    updatedNewPrayer: PrayerPoint;
    topicId: string;
  }>;
  removePrayerPointEmbeddings(
    originPrayer: PrayerPoint,
  ): Promise<PrayerPoint | undefined>;
  setContextFromJourneyAndGetEmbeddings(
    journey: PrayerPointInPrayerTopicDTO[],
  ): Promise<{ contextAsStrings: string; contextAsEmbeddings: number[] }>;
  updatePrayerPointWithLinkedTopic(
    prayerPoint: PrayerPoint,
    topicToModify: LinkedTopicInPrayerDTO,
    isExistingPrayerPoint?: boolean,
  ): Promise<PrayerPoint>;
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
    isExistingPrayerPoint?: boolean,
    topicToModify?: LinkedTopicInPrayerDTO,
    options?: { remove?: boolean },
  ): Promise<PrayerPoint>;
  linkPrayerPoint(
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    user: User,
    isNewPrayerPoint: boolean,
    topicTitle?: string,
  ): Promise<{
    finalPrayerPoint?: PrayerPoint;
    fullOriginPrayer?: LinkedPrayerEntity;
    topicId?: string;
  }>;
  linkAndSyncPrayerPoint(
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    user: User,
    prayerTopicDTO: FlatPrayerTopicDTO,
    isNewPrayerPoint: boolean,
  ): Promise<{
    finalPrayerPoint?: PrayerPoint;
    fullOriginPrayer?: LinkedPrayerEntity;
    topicId?: string;
  }>;
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

  // Load the prayer (either prayer point or prayer topic)
  loadPrayer = async (
    prayer: LinkedPrayerEntity,
  ): Promise<LinkedPrayerEntity | null> => {
    try {
      let fetchedPrayer = null;
      switch (prayer?.entityType) {
        case EntityType.PrayerPoint:
          fetchedPrayer = await prayerPointService.getPrayerPoint(
            prayer.id as PrayerPoint['id'],
          );
          break;
        case EntityType.PrayerTopic:
          fetchedPrayer = await prayerTopicService.getPrayerTopic(
            prayer.id as PrayerTopic['id'],
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

  setContextFromJourneyAndGetEmbeddings = async (
    journey: PrayerPointInPrayerTopicDTO[],
  ): Promise<{ contextAsStrings: string; contextAsEmbeddings: number[] }> => {
    const getCleanedText = (p: PrayerPointInPrayerTopicDTO) => {
      const title = p.title?.trim();
      const trimmedContent = p.content
        ?.slice(0, this.maxCharactersPerPrayerContext)
        ?.trim();

      // logic to handle empty titles, empty content, etc.
      if (title && trimmedContent) {
        return `${title}, ${trimmedContent}`;
      } else if (title) {
        return title;
      } else if (trimmedContent) {
        return trimmedContent;
      } else {
        return '';
      }
    };

    const contextAsStrings = journey
      .map(getCleanedText)
      .filter(Boolean)
      .join(', ');

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

    const deduped = Array.from(new Map(journey.map((j) => [j.id, j])).values());

    return deduped.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  };

  updatePrayerTopicWithJourneyAndGetTopicEmbeddings = async (
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    topicId: string,
  ) => {
    const journey = this.getJourney(prayerPoint, originPrayer);

    if (!journey || journey.length === 0) {
      console.warn('Empty journey; removing journey and context fields');
      return await prayerTopicService.updatePrayerTopic(topicId, {
        journey: deleteField(),
        contextAsStrings: deleteField(),
        contextAsEmbeddings: deleteField(),
      });
    }

    const { contextAsStrings, contextAsEmbeddings } =
      await this.setContextFromJourneyAndGetEmbeddings(journey);

    if (!contextAsStrings || !contextAsEmbeddings) {
      console.error('Missing context or embeddings');
    }

    return await prayerTopicService.updatePrayerTopic(topicId, {
      journey,
      contextAsStrings,
      contextAsEmbeddings,
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

    const sharedFields = {
      id: selectedPrayer.id,
      content: content,
      contextAsStrings: '',
      contextAsEmbeddings: [],
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
    isExistingPrayerPoint?: boolean,
    topicToModify?: LinkedTopicInPrayerDTO,
    options?: { remove?: boolean },
  ): Promise<PrayerPoint> => {
    let existingTopics: LinkedTopicInPrayerDTO[] = [];
    existingTopics = !isExistingPrayerPoint
      ? []
      : Array.isArray(prayerPoint.linkedTopics)
        ? (prayerPoint.linkedTopics as LinkedTopicInPrayerDTO[])
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
        linkedTopics: updatedTopics.length > 0 ? updatedTopics : undefined,
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
      linkedTopics: mergedLinkedTopics,
    };
  };

  // Update prayer point with a linked topic
  updatePrayerPointWithLinkedTopic = async (
    prayerPoint: PrayerPoint,
    topicToModify: LinkedTopicInPrayerDTO,
    isExistingPrayerPoint?: boolean,
  ): Promise<PrayerPoint> => {
    const updated = await this.updateLinkedPrayerTopic(
      prayerPoint,
      isExistingPrayerPoint,
      topicToModify,
    );
    if (isExistingPrayerPoint) {
      if (!prayerPoint.id) {
        console.error(
          'UpdatePrayerPointWithLinkedTopic: Missing prayer point ID',
        );
        return updated;
      }
      await prayerPointService.updatePrayerPoint(prayerPoint.id, {
        linkedTopics: updated.linkedTopics,
      });
    }
    return updated;
  };

  // Link to an existing prayer topic
  linkToExistingTopic = async (
    originTopic: PrayerTopic,
    topicDTO: FlatPrayerTopicDTO,
    isNewPrayerPoint: boolean,
    prayerPoint: PrayerPoint,
  ): Promise<PrayerPoint> => {
    await prayerTopicService.updatePrayerTopic(
      originTopic.id,
      topicDTO as UpdatePrayerTopicDTO,
    );

    const linkedTopic: LinkedTopicInPrayerDTO = {
      id: originTopic.id,
      title: originTopic.title,
    };

    const updatedPrayerPoint = await this.updatePrayerPointWithLinkedTopic(
      prayerPoint,
      linkedTopic,
      !isNewPrayerPoint,
    );

    if (!updatedPrayerPoint) {
      throw new Error('Failed to update prayer point with linked topic');
    }

    return updatedPrayerPoint;
  };

  linkToNewTopic = async (
    originPrayerPoint: PrayerPoint,
    topicDTO: FlatPrayerTopicDTO,
    isNewPrayerPoint: boolean,
    prayerPoint: PrayerPoint,
  ): Promise<{
    updatedNewPrayer: PrayerPoint;
    topicId: string;
  }> => {
    const topicId = (await prayerTopicService.createPrayerTopic(
      topicDTO as CreatePrayerTopicDTO,
    )) as string;

    const linkedTopic: LinkedTopicInPrayerDTO = {
      id: topicId,
      title: topicDTO.title,
    };

    const updatedNewPrayer = await this.updatePrayerPointWithLinkedTopic(
      prayerPoint,
      linkedTopic,
      !isNewPrayerPoint,
    );

    await this.updatePrayerPointWithLinkedTopic(
      originPrayerPoint,
      linkedTopic,
      true,
    );

    if (!updatedNewPrayer) {
      throw new Error('Failed to update prayer point with linked topic');
    }

    return { updatedNewPrayer, topicId };
  };

  // This function links the selected prayer point to the new prayer point or topic.
  // If the selected prayer point is a prayer topic:
  // 1) updates the context and embeddings for the prayer topic.
  // 2) deletes the embedding from the original prayer point.
  // 3) removes the embedding from the new prayer point.

  // If the selected prayer point is a prayer point:
  // 1) gets the context and embeddings for the new prayer topic.
  // 2) creates the prayer topic in Firebase.
  // 3) deletes the embedding from the original prayer point.
  // 4) removes the embedding from the new prayer point.
  linkPrayerPoint = async (
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    user: User,
    isNewPrayerPoint: boolean,
    topicTitle?: string,
  ): Promise<{
    finalPrayerPoint?: PrayerPoint;
    fullOriginPrayer?: LinkedPrayerEntity;
    topicId?: string;
  }> => {
    try {
      const fullOriginPrayer = (await prayerLinkingService.loadPrayer(
        originPrayer,
      )) as LinkedPrayerEntity;

      // Get topic DTO for either creation or update.
      if (!fullOriginPrayer || !fullOriginPrayer.id) return {};
      const topicDTO = (await prayerLinkingService.getPrayerTopicDTO({
        prayerPoint,
        selectedPrayer: fullOriginPrayer,
        topicTitle,
        user,
      })) as FlatPrayerTopicDTO;
      if (!topicDTO) return {};

      // Create or update topics, or update origin prayer points, and then return updated prayer point.
      let updatedPrayerPoint: PrayerPoint;
      let topicId = '';
      const { entityType } = originPrayer;

      if (entityType === EntityType.PrayerTopic && isValidUpdateDTO(topicDTO)) {
        updatedPrayerPoint = await prayerLinkingService.linkToExistingTopic(
          fullOriginPrayer as PrayerTopic,
          topicDTO,
          isNewPrayerPoint,
          prayerPoint,
        );
        topicId = fullOriginPrayer.id;
      } else if (
        entityType === EntityType.PrayerPoint &&
        isValidCreateDTO(topicDTO)
      ) {
        const result = await prayerLinkingService.linkToNewTopic(
          fullOriginPrayer as PrayerPoint,
          topicDTO,
          isNewPrayerPoint,
          prayerPoint,
        );
        updatedPrayerPoint = result.updatedNewPrayer;
        topicId = result.topicId;
      } else {
        return {};
      }

      const finalPrayerPoint =
        prayerLinkingService.removeEmbeddingLocally(updatedPrayerPoint);

      return { finalPrayerPoint, fullOriginPrayer, topicId };
    } catch (err) {
      console.error('Error linking prayer point:', err);
      return {};
    }
  };

  linkAndSyncPrayerPoint = async (
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    user: User,
    prayerTopicDTO: FlatPrayerTopicDTO,
    isNewPrayerPoint: boolean,
  ): Promise<{
    finalPrayerPoint?: PrayerPoint;
    fullOriginPrayer?: LinkedPrayerEntity;
    topicId?: string;
  }> => {
    if (!originPrayer || !prayerTopicDTO || !user) return {};
    try {
      const result = await this.linkPrayerPoint(
        prayerPoint,
        originPrayer,
        user,
        isNewPrayerPoint,
        prayerTopicDTO as string,
      );
      return result;
    } catch (error) {
      console.error('Error in linkAndSyncPrayerPoint:', error);
      throw new Error('Failed to link and sync prayer point');
    }
  };
}

export const prayerLinkingService = new PrayerLinkingService(db);
