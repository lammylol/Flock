import PrayerPointEditor from '@/components/Prayer/PrayerEdit/PrayerPointEditor';
import { EditMode, LinkedPrayerPointPair } from '@/types/ComponentProps';
import { usePrayerMetadataContext } from '@/context/PrayerMetadataContext';
import { LinkedTopicInPrayerDTO, PrayerPoint } from '@/types/firebase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { uniqueId } from 'lodash';

const PrayerPointMetadataFromPrayerScreen = () => {
  const params = useLocalSearchParams() as {
    id: string;
  };

  const { prayerPoints, updatePrayerPoints, addLinkedPrayerPairs } =
    usePrayerMetadataContext();

  const prayerPoint = prayerPoints.find(
    (point) => point.id === params.id,
  ) as Partial<PrayerPoint>;

  const router = useRouter();

  const handleSubmitLocal = (
    prayerPoint: PrayerPoint,
    linkedPrayerPair?: LinkedPrayerPointPair,
  ) => {
    let updatedPoint = { ...prayerPoint };

    if (
      (linkedPrayerPair?.topicTitle &&
        Array.isArray(updatedPoint.linkedTopics)) ||
      !updatedPoint.linkedTopics
    ) {
      const topicTitle = linkedPrayerPair?.topicTitle;

      const exists = updatedPoint.linkedTopics?.some(
        (item) => item.title === topicTitle,
      );

      updatedPoint.linkedTopics = exists
        ? updatedPoint.linkedTopics?.filter((item) => item.title !== topicTitle)
        : [
          ...(updatedPoint.linkedTopics || []),
          { id: uniqueId(), title: topicTitle } as LinkedTopicInPrayerDTO,
        ];
    }

    if (linkedPrayerPair) {
      addLinkedPrayerPairs({
        ...linkedPrayerPair,
        prayerPoint: updatedPoint, // ensures consistency
      });
    }

    updatePrayerPoints(updatedPoint);
    console.log('Updated prayer point:', updatedPoint);
    router.back();
  };

  return (
    <PrayerPointEditor
      editMode={EditMode.EDIT}
      shouldPersist={false}
      initialContent={prayerPoint as Partial<PrayerPoint>}
      onSubmitLocal={handleSubmitLocal}
    />
  );
};

export default PrayerPointMetadataFromPrayerScreen;
