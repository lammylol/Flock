import {
  CreatePrayerPointDTO,
  FlatPrayerPointDTO,
  FlatPrayerTopicDTO,
  LinkedPrayerEntity,
  PrayerPoint,
  UpdatePrayerPointDTO,
} from '@/types/firebase';
import OpenAiService from '@/services/ai/openAIService';
import { User } from 'firebase/auth';
import { prayerLinkingService } from './prayerLinkingService';
import { EntityType } from '@/types/PrayerSubtypes';
import { Alert } from 'react-native';
import { deleteField, Timestamp } from 'firebase/firestore';
import { prayerPointService } from './prayerPointService';
import {
  isValidCreatePrayerPointDTO,
  isValidUpdatePrayerPointDTO,
} from '@/types/typeGuards';
import { getContextFieldsIfEmbeddingsExist } from './sharedPrayerServices';
import { getDateString } from '@/utils/dateUtils';

export interface ISubmitOperationsService {
  createPrayerPoint: (
    data: PrayerPoint,
    user: User,
    aiOptIn: boolean,
  ) => Promise<PrayerPoint>;
  updatePrayerPoint: (id: string, data: PrayerPoint) => Promise<void>;
  submitPrayerPointWithEmbeddingsAndLinking: ({
    formState,
    prayerPoint,
    originPrayer,
    prayerTopicDTO,
    user,
    embedding,
    aiOptIn,
    handlePrayerPointUpdate,
  }: {
    formState: { isEditMode: boolean };
    prayerPoint: PrayerPoint;
    originPrayer?: LinkedPrayerEntity | undefined;
    prayerTopicDTO?: FlatPrayerTopicDTO | undefined;
    user: User;
    embedding: number[] | undefined;
    aiOptIn: boolean;
    handlePrayerPointUpdate: (p: PrayerPoint) => void;
  }) => Promise<PrayerPoint>;
}

class SubmitOperationsService implements ISubmitOperationsService {
  openAiService = OpenAiService.getInstance();
  now = Timestamp.now();

  // requires parameter to be passed in to avoid possible useState delay.
  createPrayerPoint = async (
    data: PrayerPoint,
    user: User,
    aiOptIn: boolean,
  ): Promise<PrayerPoint> => {
    if (!user?.uid) throw new Error('User not authenticated');

    let contextAsEmbeddings = data.contextAsEmbeddings as number[] | undefined;
    let contextAsStrings = data.contextAsStrings as string | undefined;

    // Only generate embeddings if not present AND user opted in AND not linked to topics
    const shouldGenerateEmbeddings =
      !contextAsEmbeddings && !data.linkedTopics && aiOptIn;

    if (shouldGenerateEmbeddings) {
      const dateStr = data.createdAt
        ? getDateString(data.createdAt)
        : getDateString(this.now);
      contextAsStrings = `${dateStr}, ${data.title}, ${data.content}`.trim();
      contextAsEmbeddings =
        await this.openAiService.getVectorEmbeddings(contextAsStrings);
    }

    // Final validation + fallback cleanup
    const contextFields = getContextFieldsIfEmbeddingsExist(
      contextAsEmbeddings,
      contextAsStrings,
    );

    const prayerPointData: CreatePrayerPointDTO = {
      title: data.title?.trim() ?? '',
      content: data.content.trim() ?? '',
      privacy: data.privacy ?? 'private',
      prayerType: data.prayerType ?? 'request',
      prayerId: data.prayerId,
      tags: data.tags,
      authorId: user.uid,
      authorName: user.displayName || 'unknown',
      recipientName: data.recipientName || 'unknown',
      recipientId: data.recipientId || 'unknown',
      contextAsEmbeddings: contextFields.contextAsEmbeddings,
      contextAsStrings: contextFields.contextAsStrings,
      ...(Array.isArray(data.linkedTopics) && data.linkedTopics.length > 0
        ? { linkedTopics: data.linkedTopics }
        : undefined), // ensures no NaN or empty array is sent to firebase.
    };

    if (!isValidCreatePrayerPointDTO(prayerPointData))
      throw new Error('Invalid prayer point data');
    const docRefId =
      await prayerPointService.createPrayerPoint(prayerPointData);

    return {
      ...prayerPointData,
      id: docRefId,
      createdAt: new Date(),
    } as PrayerPoint; // return the created prayer point with the ID.
  };

  // requires parameter to be passed in to avoid possible useState delay.
  updatePrayerPoint = async (id: string, data: UpdatePrayerPointDTO) => {
    if (!id) throw new Error('No prayer point ID provided');
    const { contextAsEmbeddings, contextAsStrings } =
      getContextFieldsIfEmbeddingsExist(
        data.contextAsEmbeddings as number[],
        data.contextAsStrings as string,
      );

    const updateData: UpdatePrayerPointDTO = {
      title: data.title?.trim() ?? '', // even if user doesn't enter title, it must be passed.
      content: data.content?.trim() ?? '', // even if user doesn't enter content, it must be passed.
      privacy: data.privacy ?? 'private',
      tags: data.tags,
      prayerType: data.prayerType,
      contextAsEmbeddings,
      contextAsStrings,
      linkedTopics:
        data.linkedTopics == null ? deleteField() : data.linkedTopics,
    };

    if (!isValidUpdatePrayerPointDTO(updateData))
      throw new Error('Invalid prayer point data');

    await prayerPointService.updatePrayerPoint(id, updateData);
  };

  submitPrayerPointWithEmbeddingsAndLinking = async ({
    formState,
    prayerPoint,
    originPrayer,
    topicTitle,
    user,
    embedding,
    aiOptIn,
  }: {
    formState: { isEditMode: boolean };
    prayerPoint: PrayerPoint;
    originPrayer?: LinkedPrayerEntity | undefined;
    topicTitle?: string;
    user: User;
    embedding?: number[] | undefined;
    aiOptIn: boolean;
  }): Promise<PrayerPoint> => {
    try {
      let fullOriginPrayer: LinkedPrayerEntity | undefined;
      let topicId: string | undefined;

      // set DTO with minimal data.
      let updatedPrayerPointDTO: FlatPrayerPointDTO = {
        ...prayerPoint,
      };

      console.log('updatedPrayerPointDTO', updatedPrayerPointDTO);

      // if there is linking happening, we need to handle prayer linking.
      if (originPrayer && topicTitle) {
        const result =
          await prayerLinkingService.CreateOrUpdateTopicAndUpdatePrayerPoints(
            prayerPoint,
            originPrayer,
            user,
            !formState.isEditMode,
            aiOptIn,
            topicTitle,
          );
        updatedPrayerPointDTO = result.updatedPrayerPointWithTopic;
        fullOriginPrayer = result.fullOriginPrayer;
        topicId = result.topicId;

        updatedPrayerPointDTO = {
          ...updatedPrayerPointDTO,
          ...result.updatedPrayerPointWithTopic, // result may be partial
        };
      } else if (aiOptIn && !embedding) {
        // if AI is opted in and embedding is not present, generate embedding.
        try {
          const dateStr = prayerPoint.createdAt
            ? getDateString(prayerPoint.createdAt)
            : getDateString(this.now);
          const contextAsStrings =
            `${dateStr}, ${prayerPoint.title}, ${prayerPoint.content}`.trim();
          // invalid embedding is handled in the service.
          embedding =
            await this.openAiService.getVectorEmbeddings(contextAsStrings);

          updatedPrayerPointDTO = {
            ...updatedPrayerPointDTO,
            contextAsEmbeddings: embedding == null ? deleteField() : embedding,
            contextAsStrings:
              embedding == null ? deleteField() : contextAsStrings,
          };
        } catch (error) {
          console.error('Error generating embedding:', error);
        }
      }

      let finalPrayerPoint: PrayerPoint; // this will be used to set the journey of the topic after prayer point is created.
      // additional fields are added in the createPrayerPoint method such as id, createdAt, etc.

      // create or update the user's prayer point.
      if (formState.isEditMode && prayerPoint.id) {
        await this.updatePrayerPoint(prayerPoint.id, updatedPrayerPointDTO);
        finalPrayerPoint = updatedPrayerPointDTO as PrayerPoint; // this type allows to pass in prayer point. CreatePrayer will handle undefined values.
      } else {
        finalPrayerPoint = (await this.createPrayerPoint(
          updatedPrayerPointDTO as PrayerPoint, // this type allows to pass in prayer point. CreatePrayer will handle undefined values.
          user,
          aiOptIn,
        )) as PrayerPoint;
      }

      // Update the journey of the topic, after the prayer point is created.
      if (fullOriginPrayer && topicId) {
        await prayerLinkingService.updatePrayerTopicWithJourneyAndGetTopicEmbeddings(
          finalPrayerPoint,
          fullOriginPrayer,
          topicId,
          aiOptIn,
        );
      }

      if (fullOriginPrayer?.entityType === EntityType.PrayerPoint) {
        await prayerLinkingService.removeEmbeddingFromFirebase(
          fullOriginPrayer,
        );
      }
      return finalPrayerPoint;
    } catch (error) {
      console.error('Error submitting prayer point:', error);
      Alert.alert('Something went wrong', 'Please try again.');
      return prayerPoint;
    }
  };
}

export const submitOperationsService = new SubmitOperationsService();
