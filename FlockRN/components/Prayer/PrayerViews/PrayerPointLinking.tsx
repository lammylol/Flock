import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import {
  PartialLinkedPrayerEntity,
  LinkedPrayerEntity,
  PrayerPoint,
  LinkedTopicInPrayerDTO,
} from '@/types/firebase';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { EditMode, LinkedPrayerPointPair } from '@/types/ComponentProps';
import PrayerCardWithButtons from './PrayerCardWithButtons';
import LinkPrayerModal from './LinkPrayerModal';
import Ionicons from '@expo/vector-icons/Ionicons';
import { usePrayerMetadataContext } from '@/context/PrayerMetadataContext';
import { ThemedText } from '@/components/ThemedText';

export function PrayerPointLinking({
  editMode,
  backgroundColor,
  similarPrayers,
  linkedPrayerPairs,
  prayerPoint,
  onChange,
}: {
  editMode: EditMode;
  backgroundColor?: string;
  similarPrayers?: PartialLinkedPrayerEntity[];
  linkedPrayerPairs?: LinkedTopicInPrayerDTO[];
  prayerPoint: PrayerPoint;
  onChange?: (selectedPrayer: LinkedPrayerEntity, title?: string) => void;
}): JSX.Element {
  const [searchText, setSearchText] = useState('');
  const [selectedLink, setSelectedLink] = useState<LinkedPrayerEntity | null>(
    null,
  );
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const titleColor = useThemeColor({}, 'textPrimary');
  const [showLinkSection, setShowLinkSection] = useState(true);

  // useEffect(() => {
  //   setSelectedLink(
  //     linkedPrayerPairs?.find((pair) => pair.originPrayer === prayerPoint.id)
  //       ?.originPrayer || null,
  //   );
  // }, [linkedPrayerPairs, prayerPoint.id]);

  const determineLabel = (prayer: LinkedPrayerEntity): string => {
    if (prayer.id === selectedLink?.id) return 'Linked';
    return 'Link Prayers';
  };

  const handleAddTopic = async (
    selectedPrayer: LinkedPrayerEntity,
    title?: string,
  ) => {
    if (onChange) {
      onChange(selectedPrayer as LinkedPrayerEntity, title);
    }
  };

  const handleOpenModal = (prayer: LinkedPrayerEntity) => {
    if (selectedLink?.id === prayer.id) {
      // If already selected, unlink it
      setSelectedLink(null);
      if (onChange) {
        onChange(null as unknown as LinkedPrayerEntity); // Optionally inform parent to unlink
      }
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
      <View style={styles.modalHeader}>
        <ThemedText style={{ ...styles.modalTitle, color: titleColor }}>
          Link to an Existing Prayer
        </ThemedText>
        <TouchableOpacity onPress={() => setShowLinkSection(!showLinkSection)}>
          <ThemedText style={{ ...styles.expandTitle, color: Colors.link }}>
            {showLinkSection ? 'Hide' : 'Show'}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {showLinkSection ? (
        <View style={styles.linkContainer}>
          {Array.isArray(prayerPoint.linkedTopics) &&
            prayerPoint.linkedTopics.length > 0 ? (
            prayerPoint.linkedTopics.map((linkedPrayer, index) => (
              <PrayerCardWithButtons
                key={linkedPrayer.id ?? index}
                prayer={linkedPrayer as LinkedPrayerEntity}
                button1={{
                  label: determineLabel(linkedPrayer as LinkedPrayerEntity),
                  onPress: () =>
                    handleOpenModal(linkedPrayer as LinkedPrayerEntity),
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
            ))
          ) : similarPrayers!.length > 0 ? (
            <>
              {similarPrayers!.slice(0, 3).map((prayer, index) => {
                const typedPrayer = prayer as LinkedPrayerEntity;
                return (
                  <PrayerCardWithButtons
                    key={index}
                    prayer={typedPrayer}
                    button1={{
                      label: determineLabel(typedPrayer),
                      onPress: () => handleOpenModal(typedPrayer),
                      fontWeight: '500',
                      icon: (
                        <Ionicons
                          name={
                            linkIcon(
                              typedPrayer,
                            ) as keyof typeof Ionicons.glyphMap
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
            </>
          ) : null}
        </View>
      ) : null}

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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expandTitle: {
    color: Colors.link,
    fontSize: 18,
    fontWeight: '400',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
  },
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
