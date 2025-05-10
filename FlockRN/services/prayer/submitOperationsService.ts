import {
  CreatePrayerPointDTO,
  FlatPrayerPointDTO,
  FlatPrayerTopicDTO,
  LinkedPrayerEntity,
  PrayerPoint,
  PrayerPointInTopicJourneyDTO,
  UpdatePrayerPointDTO,
} from '@/types/firebase';
import OpenAiService from '@/services/ai/openAIService';
import { User } from 'firebase/auth';
import { prayerLinkingService } from './prayerLinkingService';
import { EntityType } from '@/types/PrayerSubtypes';
import { Alert } from 'react-native';
import { deleteField } from 'firebase/firestore';
import { prayerPointService } from './prayerPointService';
import {
  isValidCreatePrayerPointDTO,
  isValidPrayerPointInJourneyDTO,
  isValidUpdatePrayerPointDTO,
} from '@/types/typeGuards';

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
    handlePrayerPointUpdate,
  }: {
    formState: { isEditMode: boolean };
    prayerPoint: PrayerPoint;
    originPrayer?: LinkedPrayerEntity | undefined;
    prayerTopicDTO?: FlatPrayerTopicDTO | undefined;
    user: User;
    embedding: number[] | undefined;
    handlePrayerPointUpdate: (p: PrayerPoint) => void;
  }) => Promise<PrayerPoint>;
}

class SubmitOperationsService implements ISubmitOperationsService {
  openAiService = OpenAiService.getInstance();

  // requires parameter to be passed in to avoid possible useState delay.
  createPrayerPoint = async (
    data: PrayerPoint,
    user: User,
    aiOptIn: boolean,
  ): Promise<PrayerPoint> => {
    let embeddingInput = (data.embedding as number[]) || undefined;

    // only generate embedding if not already present (in cases where
    // user edits and creates before embeddings are generated).
    // Do not generate if new prayer point is linked to a topic.
    if (!embeddingInput && !data.linkedTopics && aiOptIn) {
      const input = `${data.title} ${data.content}`.trim();
      embeddingInput = await this.openAiService.getVectorEmbeddings(input);
    }

    if (!user?.uid) throw new Error('User not authenticated');

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
      ...(Array.isArray(embeddingInput) && embeddingInput.length > 0
        ? { embedding: embeddingInput }
        : {}), // ensures no NaN or empty array is sent to firebase.
      ...(Array.isArray(data.linkedTopics) && data.linkedTopics.length > 0
        ? { linkedTopics: data.linkedTopics }
        : {}), // ensures no NaN or empty array is sent to firebase.
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
    const updateData: UpdatePrayerPointDTO = {
      title: data.title?.trim(),
      content: data.content,
      privacy: data.privacy ?? 'private',
      tags: data.tags,
      prayerType: data.prayerType,
      embedding: data.embedding == null ? deleteField() : data.embedding,
      linkedTopics:
        data.linkedTopics == null ? deleteField() : data.linkedTopics,
    };
    if (!isValidUpdatePrayerPointDTO(data))
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
          // invalid embedding is handled in the service.
          embedding = await this.openAiService.getVectorEmbeddings(
            `${prayerPoint.title} ${prayerPoint.content}`.trim(),
          );

          updatedPrayerPointDTO = {
            ...updatedPrayerPointDTO,
            embedding: embedding == null ? deleteField() : embedding,
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
