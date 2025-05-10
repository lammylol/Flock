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
  PrayerPointInTopicJourneyDTO,
  CreatePrayerTopicDTO,
  UpdatePrayerTopicDTO,
  LinkedPrayerEntity,
  LinkedTopicInPrayerDTO,
  FlatPrayerTopicDTO,
  PrayerTopic,
} from '@/types/firebase';
import {
  isPrayerTopic,
  isValidCreateTopicDTO,
  isValidPrayerPointInJourneyDTO,
  isValidUpdateTopicDTO,
  validateJourneyField,
} from '@/types/typeGuards';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { User } from 'firebase/auth';
import { prayerPointService } from './prayerPointService';
import { prayerTopicService } from './prayerTopicService';
import { FirestoreCollections } from '@/schema/firebaseCollections';
import normalizeDate from '@/utils/dateUtils';

export interface IPrayerLinkingService {
  loadPrayer(
    originPrayer: LinkedPrayerEntity,
  ): Promise<LinkedPrayerEntity | null>;
  getJourney(
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
  ): PrayerPointInTopicJourneyDTO[];
  updatePrayerTopicWithJourneyAndGetTopicEmbeddings(
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
    topicId: string,
    aiOptIn: boolean,
  ): Promise<void>;
  getDistinctPrayerTypes(
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
  ): PrayerType[];
  updateExistingPrayerTopicAndAddLinkedTopicToPrayerPoint(
    originTopic: PrayerTopic,
    topicDTO: FlatPrayerTopicDTO,
    isNewPrayerPoint: boolean,
    prayerPoint: PrayerPoint,
  ): Promise<PrayerPoint>;
  createNewTopicAndLinkTopicToBothPrayerPoints(
    originPrayerPoint: PrayerPoint,
    topicDTO: FlatPrayerTopicDTO,
    isNewPrayerPoint: boolean,
    prayerPoint: PrayerPoint,
    aiOptIn: boolean,
  ): Promise<{
    updatedPrayerPoint: PrayerPoint;
    topicId: string;
  }>;
  removePrayerPointEmbeddings(
    originPrayer: PrayerPoint,
  ): Promise<PrayerPoint | undefined>;
  setContextFromJourneyAndGetEmbeddings(
    journey: PrayerPointInTopicJourneyDTO[],
  ): Promise<{ contextAsStrings: string; contextAsEmbeddings: number[] }>;
  updatePrayerPointWithLinkedTopic(
    prayerPoint: PrayerPoint,
    topicToModify: LinkedTopicInPrayerDTO,
    isExistingPrayerPoint?: boolean,
  ): Promise<PrayerPoint>;
  getPrayerTopicDTO(
    prayerPoint: PrayerPoint,
    selectedPrayer: LinkedPrayerEntity,
    user: User,
    topicTitle?: string,
  ): Promise<{
    topicDTO: FlatPrayerTopicDTO;
    fullOriginPrayer: LinkedPrayerEntity;
  }>;
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
  CreateOrUpdateTopicAndUpdatePrayerPoints(
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    user: User,
    isNewPrayerPoint: boolean,
    aiOptIn: boolean,
    topicTitle?: string,
  ): Promise<{
    updatedPrayerPointWithTopic?: PrayerPoint;
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
    journey: PrayerPointInTopicJourneyDTO[],
  ): Promise<{ contextAsStrings: string; contextAsEmbeddings: number[] }> => {
    const getCleanedText = (p: PrayerPointInTopicJourneyDTO) => {
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
  ): PrayerPointInTopicJourneyDTO[] => {
    const toDTO = (
      p: PrayerPointInTopicJourneyDTO,
    ): PrayerPointInTopicJourneyDTO => ({
      id: p.id,
      prayerType: p.prayerType ?? 'request',
      title: p.title,
      content: p.content,
      createdAt: normalizeDate(p.createdAt),
      authorId: p.authorId ?? 'unknown',
      authorName: p.authorName,
      recipientName: p.recipientName,
    });

    const normalizeJourney = (): PrayerPointInTopicJourneyDTO[] => {
      if (isPrayerTopic(originPrayer) && Array.isArray(originPrayer.journey)) {
        return (originPrayer.journey as PrayerPointInTopicJourneyDTO[]).map(
          toDTO,
        );
      }
      return [toDTO(originPrayer as PrayerPointInTopicJourneyDTO)];
    };

    const prayerForJourney = toDTO(prayerPoint);
    if (!isValidPrayerPointInJourneyDTO(toDTO(prayerPoint)))
      console.error('Invalid prayer point in journey DTO');

    const journey = [...normalizeJourney(), prayerForJourney];

    const deduped = Array.from(new Map(journey.map((j) => [j.id, j])).values());
    return deduped.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  };

  updatePrayerTopicWithJourneyAndGetTopicEmbeddings = async (
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    topicId: string,
    aiOptIn: boolean,
  ) => {
    const journey = this.getJourney(prayerPoint, originPrayer);

    if (!journey || journey.length === 0 || !validateJourneyField(journey)) {
      console.warn('Empty journey; removing journey and context fields');
      return await prayerTopicService.updatePrayerTopic(topicId, {
        journey: deleteField(),
        contextAsStrings: deleteField(),
        contextAsEmbeddings: deleteField(),
      });
    }

    let contextAsStrings: string | undefined;
    let contextAsEmbeddings: number[] | undefined;

    if (aiOptIn) {
      ({ contextAsStrings, contextAsEmbeddings } =
        await this.setContextFromJourneyAndGetEmbeddings(journey));
    }
    const updateData: Record<string, unknown> = { journey };

    if (contextAsStrings !== undefined) {
      updateData.contextAsStrings = contextAsStrings;
    }

    if (contextAsEmbeddings !== undefined) {
      updateData.contextAsEmbeddings = contextAsEmbeddings;
    }

    return await prayerTopicService.updatePrayerTopic(topicId, updateData);
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
  getPrayerTopicDTO = async (
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    user: User,
    topicTitle?: string,
  ): Promise<{
    topicDTO: FlatPrayerTopicDTO;
    fullOriginPrayer: LinkedPrayerEntity;
  }> => {
    if (!user.uid) throw new Error('User ID is not available');

    const fullOriginPrayer = (await prayerLinkingService.loadPrayer(
      originPrayer,
    )) as LinkedPrayerEntity;
    if (!fullOriginPrayer)
      throw new Error('Failed to load full origin prayer.');

    const originPrayerTypes = this.getDistinctPrayerTypes(
      prayerPoint,
      fullOriginPrayer,
    );

    const content = `Latest ${prayerPoint.prayerType.trim()}: ${prayerPoint.title!.trim()} `;

    const sharedFields = {
      id: fullOriginPrayer.id,
      content: content,
      prayerTypes: originPrayerTypes,
    };

    let topicDTO: FlatPrayerTopicDTO;

    switch (fullOriginPrayer.entityType) {
      // if it's a topic, we need to provide the updated data
      case EntityType.PrayerTopic: {
        const updateTopicData: UpdatePrayerTopicDTO = {
          ...sharedFields,
          // title: fullOriginPrayer.title, // not needed for update data
          // authorName: fullOriginPrayer.authorName,
          // authorId: fullOriginPrayer.authorId,
        };
        topicDTO = updateTopicData;
      }

      case EntityType.PrayerPoint:
      default: {
        if (!topicTitle) {
          throw new Error('Topic title is required for prayer point');
        }
        const createTopicData: CreatePrayerTopicDTO = {
          ...sharedFields,
          title: topicTitle,
          authorName: user.displayName || 'Unknown',
          authorId: user.uid,
          status: 'open',
          privacy: 'private',
          recipientName: 'User', // topics won't use recipients, but may be helpful in the future to track.
          recipientId: 'Unknown', // could load 'all recipients that have been prayed for from this topic.'
        };
        topicDTO = createTopicData;
      }
    }

    return { topicDTO, fullOriginPrayer };
  };

  removeEmbeddingLocally = (prayerPoint: PrayerPoint): PrayerPoint => {
    return {
      ...prayerPoint,
      embedding: undefined,
    };
  };

  removeEmbeddingFromFirebase = async (prayer: LinkedPrayerEntity) => {
    if (!prayer.id) {
      console.error('Missing id for removing embedding');
      return;
    }
    await prayerPointService.updatePrayerPoint(prayer.id, {
      embedding: deleteField(),
    });
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
  updateExistingPrayerTopicAndAddLinkedTopicToPrayerPoint = async (
    originTopic: PrayerTopic,
    topicDTO: FlatPrayerTopicDTO,
    isNewPrayerPoint: boolean,
    prayerPoint: PrayerPoint,
  ): Promise<PrayerPoint> => {
    // update the existing prayer topic with the update dto.
    await prayerTopicService.updatePrayerTopic(
      originTopic.id,
      topicDTO as UpdatePrayerTopicDTO,
    );

    const linkedTopic: LinkedTopicInPrayerDTO = {
      id: originTopic.id,
      title: originTopic.title,
    };

    // update the prayer point with the linked topic.
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

  createNewTopicAndLinkTopicToBothPrayerPoints = async (
    originPrayerPoint: PrayerPoint,
    topicDTO: FlatPrayerTopicDTO,
    isNewPrayerPoint: boolean,
    prayerPoint: PrayerPoint,
    aiOptIn: boolean,
  ): Promise<{
    updatedPrayerPoint: PrayerPoint;
    topicId: string;
  }> => {
    try {
      // create new topic in firebase with the create topic DTO.
      const topicId = (await prayerTopicService.createPrayerTopic(
        topicDTO as CreatePrayerTopicDTO,
        aiOptIn as boolean,
      )) as string;

      const linkedTopic: LinkedTopicInPrayerDTO = {
        id: topicId,
        title: topicDTO.title!,
      };

      // Update the origin prayer point with the linked topic.
      await this.updatePrayerPointWithLinkedTopic(
        originPrayerPoint,
        linkedTopic,
        true,
      );

      // Update the new prayer point with the linked topic.
      const prayerPointWithNewTopic =
        await this.updatePrayerPointWithLinkedTopic(
          prayerPoint,
          linkedTopic,
          !isNewPrayerPoint,
        );

      // remove the embedding from the new prayer point, but only once the topic is created.
      const updatedPrayerPoint = this.removeEmbeddingLocally(
        prayerPointWithNewTopic,
      );

      return { updatedPrayerPoint, topicId };
    } catch (error) {
      console.error('Error creating new topic and linking:', error);
      throw error;
    }
  };

  CreateOrUpdateTopicAndUpdatePrayerPoints = async (
    prayerPoint: PrayerPoint,
    originPrayer: LinkedPrayerEntity,
    user: User,
    isNewPrayerPoint: boolean,
    aiOptIn: boolean,
    topicTitle?: string,
  ): Promise<{
    updatedPrayerPointWithTopic: PrayerPoint;
    fullOriginPrayer?: LinkedPrayerEntity;
    topicId?: string;
  }> => {
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

    try {
      // Get either update or create DTO for the intended topic.
      if (!originPrayer || !originPrayer.id)
        throw new Error('Invalid origin prayer');

      const { topicDTO, fullOriginPrayer } =
        await prayerLinkingService.getPrayerTopicDTO(
          prayerPoint,
          originPrayer,
          user,
          topicTitle,
        );
      if (!topicDTO) throw new Error('Failed to get topic DTO');

      let updatedPrayerPointWithTopic: PrayerPoint;
      let topicId = ''; // Initialize topicId with an empty string.

      if (fullOriginPrayer.entityType === EntityType.PrayerTopic) {
        // handle if updating an existing prayer topic.

        updatedPrayerPointWithTopic =
          await prayerLinkingService.updateExistingPrayerTopicAndAddLinkedTopicToPrayerPoint(
            fullOriginPrayer as PrayerTopic,
            topicDTO as UpdatePrayerTopicDTO,
            isNewPrayerPoint,
            prayerPoint,
          );
        topicId = fullOriginPrayer.id; // set the topic id as the prayer topic id that exists already.
      } else {
        // handle if creating a new prayer topic.
        if (!topicTitle) {
          throw new Error('Topic title is required for prayer topic creation');
        }
        const result =
          await prayerLinkingService.createNewTopicAndLinkTopicToBothPrayerPoints(
            fullOriginPrayer as PrayerPoint,
            topicDTO as CreatePrayerTopicDTO,
            isNewPrayerPoint,
            prayerPoint,
            aiOptIn,
          );

        updatedPrayerPointWithTopic = result.updatedPrayerPoint;
        topicId = result.topicId;
      }

      return { updatedPrayerPointWithTopic, fullOriginPrayer, topicId };
    } catch (err) {
      const errorMessage = `Error linking prayer point: ${err instanceof Error ? err.message : String(err)}`;
      console.error(errorMessage, err);
      throw new Error(errorMessage);
    }
  };
}

export const prayerLinkingService = new PrayerLinkingService(db);
