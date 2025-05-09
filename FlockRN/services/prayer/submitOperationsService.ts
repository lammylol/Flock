import {
  CreatePrayerPointDTO,
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
import { deleteField } from 'firebase/firestore';
import { prayerPointService } from './prayerPointService';

export interface ISubmitOperationsService {
  createPrayerPoint: (data: PrayerPoint, user: User) => Promise<string>;
  updatePrayerPoint: (data: PrayerPoint) => Promise<void>;
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
  ): Promise<string> => {
    let embeddingInput = (data.embedding as number[]) || undefined;

    // only generate embedding if not already present (in cases where
    // user edits and creates before embeddings are generated).
    // Do not generate if new prayer point is linked to a topic.
    if (!embeddingInput && !data.linkedTopics) {
      const input = `${data.title} ${data.content}`.trim();
      embeddingInput = await this.openAiService.getVectorEmbeddings(input);
    }

    if (!user?.uid) throw new Error('User not authenticated');

    const prayerPointData: CreatePrayerPointDTO = {
      title: data.title?.trim(),
      content: data.content.trim(),
      privacy: data.privacy ?? 'private',
      prayerType: data.prayerType,
      prayerId: data.prayerId,
      tags: data.tags,
      authorId: user.uid,
      authorName: user.displayName || 'unknown',
      status: data.status || 'open',
      recipientName: data.recipientName || 'unknown',
      recipientId: data.recipientId || 'unknown',
      ...(embeddingInput && { embedding: embeddingInput }),
      ...(data.linkedTopics && { linkedTopics: data.linkedTopics }),
    };

    const docRefId =
      await prayerPointService.createPrayerPoint(prayerPointData);
    return docRefId;
  };

  // requires parameter to be passed in to avoid possible useState delay.
  updatePrayerPoint = async (data: PrayerPoint) => {
    const updateData: UpdatePrayerPointDTO = {
      title: data.title?.trim(),
      content: data.content,
      privacy: data.privacy ?? 'private',
      tags: data.tags,
      prayerType: data.prayerType,
      status: data.status,
      embedding: data.embedding == null ? deleteField() : data.embedding,
      linkedTopics:
        data.linkedTopics == null ? deleteField() : data.linkedTopics,
    };
    await prayerPointService.updatePrayerPoint(data.id, updateData);
  };

  submitPrayerPointWithEmbeddingsAndLinking = async ({
    formState,
    prayerPoint,
    originPrayer,
    prayerTopicDTO,
    user,
    embedding,
  }: {
    formState: { isEditMode: boolean };
    prayerPoint: PrayerPoint;
    originPrayer?: LinkedPrayerEntity | undefined;
    prayerTopicDTO?: FlatPrayerTopicDTO | undefined;
    user: User;
    embedding?: number[] | undefined;
    // handlePrayerPointUpdate: (p: PrayerPoint) => void;
  }): Promise<PrayerPoint> => {
    try {
      let finalPrayerPoint: PrayerPoint | undefined;
      let fullOriginPrayer: LinkedPrayerEntity | undefined;
      let topicId: string | undefined;

      if (originPrayer && prayerTopicDTO) {
        const result = await prayerLinkingService.linkAndSyncPrayerPoint(
          prayerPoint,
          originPrayer,
          user,
          prayerTopicDTO,
          !formState.isEditMode,
        );
        finalPrayerPoint = result.finalPrayerPoint;
        fullOriginPrayer = result.fullOriginPrayer;
        topicId = result.topicId;
      }

      const mergedPrayerPoint = finalPrayerPoint
        ? finalPrayerPoint
        : {
          ...prayerPoint,
          ...(embedding && { embedding }),
        };

      let prayerPointId = mergedPrayerPoint.id;

      const mergedPrayerPointWithPrayerId = {
        ...mergedPrayerPoint,
        id: prayerPointId,
        authorId: user.uid,
        authorName: user.displayName || 'unknown',
        recipientName: mergedPrayerPoint.recipientName || 'unknown',
        recipientId: mergedPrayerPoint.recipientId || 'unknown',
      };

      if (formState.isEditMode && prayerPoint.id) {
        await this.updatePrayerPoint(mergedPrayerPointWithPrayerId);
      } else {
        prayerPointId = await this.createPrayerPoint(
          mergedPrayerPointWithPrayerId,
          user,
        );
      }

      if (fullOriginPrayer && topicId) {
        await prayerLinkingService.updatePrayerTopicWithJourneyAndGetTopicEmbeddings(
          { ...mergedPrayerPointWithPrayerId, id: prayerPointId },
          fullOriginPrayer,
          topicId,
        );
      }

      if (fullOriginPrayer?.entityType === EntityType.PrayerPoint) {
        await prayerLinkingService.removeEmbeddingFromFirebase(
          fullOriginPrayer,
        );
      }
      return mergedPrayerPointWithPrayerId;
    } catch (error) {
      console.error('Error submitting prayer point:', error);
      Alert.alert('Something went wrong', 'Please try again.');
      return prayerPoint;
    }
  };
}

export const submitOperationsService = new SubmitOperationsService();
