import { useCallback, useEffect, useState } from 'react';
import OpenAiService from '@/services/ai/openAIService';
import { auth } from '@/firebase/firebaseConfig';
import { PartialLinkedPrayerEntity, PrayerPoint } from '@/types/firebase';
import { EditMode } from '@/types/ComponentProps';
import { prayerService } from '@/services/prayer/prayerService';

export function useSimilarPrayers(
  prayerPoint: PrayerPoint,
  editMode: EditMode,
) {
  const openAiService = OpenAiService.getInstance();
  const user = auth.currentUser;
  const [similarPrayers, setSimilarPrayers] = useState<
    PartialLinkedPrayerEntity[]
  >([]);

  const findSimilarPrayers = useCallback(async () => {
    const input = `${prayerPoint.title} ${prayerPoint.content}`.trim();
    if (!input || !user?.uid) return;

    const embedding = await openAiService.getVectorEmbeddings(input);
    const sourcePrayerId =
      editMode === EditMode.EDIT ? prayerPoint.id : undefined;

    try {
      const similar = await prayerService.findRelatedPrayers(
        embedding,
        user.uid,
        sourcePrayerId,
      );
      setSimilarPrayers(similar);
    } catch (error) {
      console.error('Error finding similar prayers:', error);
    }
  }, [
    prayerPoint.title,
    prayerPoint.content,
    prayerPoint.id,
    user.uid,
    openAiService,
    editMode,
  ]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (prayerPoint.title?.trim() || prayerPoint.content?.trim()) {
        findSimilarPrayers();
      }
    }, 1000);

    return () => clearTimeout(debounce);
  }, [prayerPoint.title, prayerPoint.content, findSimilarPrayers]);

  return {
    similarPrayers,
  };
}
