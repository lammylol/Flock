import { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import {
  PartialLinkedPrayerEntity,
  LinkedPrayerEntity,
  PrayerPoint,
} from '@/types/firebase';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { EditMode } from '@/types/ComponentProps';
import PrayerCardWithButtons from './PrayerCardWithButtons';
import LinkPrayerModal from './LinkPrayerModal';
import Ionicons from '@expo/vector-icons/Ionicons';
import { usePrayerMetadataContext } from '@/context/PrayerMetadataContext';

export function PrayerPointLinking({
  backgroundColor,
  similarPrayers,
  prayerPoint,
  onChange,
}: {
  editMode: EditMode;
  backgroundColor?: string;
  similarPrayers: PartialLinkedPrayerEntity[];
  prayerPoint: PrayerPoint;
  onChange: (selectedPrayer: LinkedPrayerEntity, title?: string) => void;
}): JSX.Element {
  const [searchText, setSearchText] = useState('');
  const [selectedLink, setSelectedLink] = useState<LinkedPrayerEntity | null>(
    null,
  );
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const textColor = useThemeColor({ light: Colors.link }, 'textPrimary');
  const titleColor = useThemeColor({}, 'textPrimary');
  const [showLinkSection, setShowLinkSection] = useState(true);
  const { linkedPrayerPairs } = usePrayerMetadataContext();

  const linkedPrayer = linkedPrayerPairs.find(
    (pair) => pair.prayerPoint.id === prayerPoint.id,
  )?.originPrayer;

  useEffect(() => {
    setSelectedLink(
      linkedPrayerPairs.find((pair) => pair.prayerPoint.id === prayerPoint.id)
        ?.originPrayer || null,
    );
  }, [linkedPrayerPairs, prayerPoint.id]);

  const determineLabel = (prayer: LinkedPrayerEntity): string => {
    if (prayer.id === selectedLink?.id) return 'Linked';
    return 'Link Prayers';
  };

  const handleAddTopic = async (
    selectedPrayer: LinkedPrayerEntity,
    title?: string,
  ) => {
    onChange(selectedPrayer as LinkedPrayerEntity, title);
  };

  const handleOpenModal = (prayer: LinkedPrayerEntity) => {
    if (selectedLink?.id === prayer.id) {
      // If already selected, unlink it
      setSelectedLink(null);
      onChange(null as unknown as LinkedPrayerEntity); // Optionally inform parent to unlink
      return;
    }

    setSelectedLink(prayer);
    setShowLinkingModal(true);
  };

  const linkIcon = (prayer: LinkedPrayerEntity): string => {
    if (prayer.id === selectedLink?.id) return 'link-outline';
    return 'unlink-outline';
  };

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: backgroundColor, borderColor: Colors.grey1 },
      ]}
    >
      {showLinkSection &&
      (similarPrayers.length > 0 || prayerPoint.linkedTopics) &&
      linkedPrayer ? (
        <PrayerCardWithButtons
          key={prayerPoint.id}
          prayer={linkedPrayer}
          button1={{
            label: determineLabel(linkedPrayer),
            onPress: () => handleOpenModal(linkedPrayer),
            fontWeight: '500',
            icon: (
              <Ionicons
                name={
                  linkIcon(
                    linkedPrayer as LinkedPrayerEntity,
                  ) as keyof typeof Ionicons.glyphMap
                }
                size={20}
                color={titleColor}
              />
            ),
          }}
        />
      ) : (
        <View style={styles.linkContainer}>
          {similarPrayers.slice(0, 3).map((prayer, index) => {
            const typedPrayer = prayer as LinkedPrayerEntity;
            return (
              <PrayerCardWithButtons
                key={index}
                prayer={typedPrayer} // Type assertion
                button1={{
                  label: determineLabel(typedPrayer),
                  onPress: () => handleOpenModal(typedPrayer),
                  fontWeight: '500',
                  icon: (
                    <Ionicons
                      name={
                        linkIcon(typedPrayer) as keyof typeof Ionicons.glyphMap
                      }
                      size={20}
                      color={titleColor}
                    />
                  ),
                }}
              />
            );
          })}
          <TextInput
            style={{ ...styles.searchInput, borderColor: Colors.grey1 }}
            placeholder="Search existing prayer points..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      )}

      {/* Display LinkingModal when showLinkingModal is true */}
      {selectedLink && setShowLinkingModal && (
        <LinkPrayerModal
          visible={showLinkingModal}
          onClose={() => setShowLinkingModal(false)}
          onAddTopic={(selectedLink, title) => {
            handleAddTopic(selectedLink, title);
          }}
          originPrayer={selectedLink as LinkedPrayerEntity}
          newPrayerPoint={prayerPoint}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  container: {
    borderRadius: 15,
    borderWidth: 2,
    padding: 16,
    gap: 10,
    width: '100%', // Make it responsive to parent width
  },
  linkContainer: {
    flex: 1,
  },
});

export default PrayerPointLinking;
