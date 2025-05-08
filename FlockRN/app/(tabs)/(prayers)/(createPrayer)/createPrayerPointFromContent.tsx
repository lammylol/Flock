import PrayerPointEditor from '@/components/Prayer/PrayerEdit/PrayerPointEditor';
import { EditMode, LinkedPrayerPointPair } from '@/types/ComponentProps';
import { usePrayerMetadataContext } from '@/context/PrayerMetadataContext';
import { PrayerPoint } from '@/types/firebase';
import { useLocalSearchParams, useRouter } from 'expo-router';

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
    if (linkedPrayerPair) {
      addLinkedPrayerPairs(linkedPrayerPair);
    }

    const updatedPoint = prayerPoint as PrayerPoint;
    updatePrayerPoints(updatedPoint);
    router.back(); // or pass data to parent
    // alternatively use a context or shared state to collect results
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
