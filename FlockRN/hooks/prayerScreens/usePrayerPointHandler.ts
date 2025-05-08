// hooks/usePrayerPointHandler.ts
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { auth } from '@/firebase/firebaseConfig';
import OpenAiService from '@/services/ai/openAIService';
import {
  CreatePrayerPointDTO,
  PrayerPoint,
  UpdatePrayerPointDTO,
} from '@/types/firebase';
import { EntityType, PrayerType, Privacy } from '@/types/PrayerSubtypes';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';
import { deleteField } from 'firebase/firestore';
import { prayerPointService } from '@/services/prayer/prayerPointService';

export interface UsePrayerPointHandlerProps {
  id: string;
  privacy?: Privacy;
}
export function usePrayerPointHandler({
  id,
  privacy = 'private',
}: UsePrayerPointHandlerProps) {
  const openAiService = OpenAiService.getInstance();
  const { userPrayerPoints, updateCollection } = usePrayerCollection();
  const user = auth.currentUser;

  const [updatedPrayerPoint, setUpdatedPrayerPoint] = useState<PrayerPoint>({
    id: id || '',
    title: '',
    content: '',
    prayerType: PrayerType.Request,
    tags: [],
    linkedTopics: [],
    embedding: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    authorName: user?.displayName || 'unknown',
    authorId: user?.uid || 'unknown',
    status: 'open',
    privacy: 'private',
    recipientName: 'unknown',
    recipientId: 'unknown',
    prayerId: '',
    entityType: EntityType.PrayerPoint,
  });

  const handlePrayerPointUpdate = (data: Partial<PrayerPoint>) => {
    const newUpdated = { ...updatedPrayerPoint, ...data };
    setUpdatedPrayerPoint(newUpdated);
  };

  const loadPrayerPointFromPassingContent = useCallback(
    (data: Partial<PrayerPoint>) => {
      setUpdatedPrayerPoint(data as PrayerPoint);
    },
    [],
  );

  const loadPrayerPoint = useCallback(async () => {
    const contextPrayerPoint = userPrayerPoints.find((p) => p.id === id);
    if (contextPrayerPoint) {
      console.log('Found prayer point in context:', contextPrayerPoint);
      setUpdatedPrayerPoint({ ...contextPrayerPoint });
      return;
    }
    try {
      const fetchedPrayer = await prayerPointService.getPrayerPoint(id);
      console.log('Fetched prayer point:', fetchedPrayer);
      if (fetchedPrayer) {
        setUpdatedPrayerPoint({ ...fetchedPrayer });
      }
    } catch (error) {
      console.error('Error fetching prayer point:', error);
    }
  }, [id, userPrayerPoints]);

  // requires parameter to be passed in to avoid possible useState delay.
  const createPrayerPoint = async (data: PrayerPoint): Promise<string> => {
    let embeddingInput = (data.embedding as number[]) || undefined;

    // only generate embedding if not already present (in cases where
    // user edits and creates before embeddings are generated).
    // Do not generate if new prayer point is linked to a topic.
    if (!embeddingInput && !data.linkedTopics) {
      const input = `${data.title} ${data.content}`.trim();
      embeddingInput = await openAiService.getVectorEmbeddings(input);
    }

    if (!user?.uid) throw new Error('User not authenticated');

    const prayerPointData: CreatePrayerPointDTO = {
      title: data.title?.trim(),
      content: data.content.trim(),
      privacy: data.privacy || privacy,
      prayerType: data.prayerType,
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
    Alert.alert('Success', 'Prayer Point created successfully.');
    return docRefId;
  };

  // requires parameter to be passed in to avoid possible useState delay.
  const updatePrayerPoint = async (data: PrayerPoint) => {
    const updateData: UpdatePrayerPointDTO = {
      title: data.title?.trim(),
      content: data.content,
      privacy: data.privacy || privacy,
      tags: data.tags,
      prayerType: data.prayerType,
      status: data.status,
      embedding: data.embedding == null ? deleteField() : data.embedding,
      linkedTopics:
        data.linkedTopics == null ? deleteField() : data.linkedTopics,
    };
    await prayerPointService.updatePrayerPoint(data.id, updateData);

    updateCollection(
      { ...updatedPrayerPoint, ...updateData } as PrayerPoint,
      'prayerPoint',
    );
    Alert.alert('Success', 'Prayer Point updated successfully');
  };

  return {
    updatedPrayerPoint,
    setUpdatedPrayerPoint,
    handlePrayerPointUpdate,
    createPrayerPoint,
    updatePrayerPoint,
    loadPrayerPoint,
    loadPrayerPointFromPassingContent,
  };
}
