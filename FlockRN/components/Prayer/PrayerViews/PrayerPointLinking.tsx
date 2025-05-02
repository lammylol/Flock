import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
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
import { EntityType } from '@/types/PrayerSubtypes';

export function PrayerPointLinking({
  editMode,
  backgroundColor,
  similarPrayers,
  prayerPoint,
  onChange,
}: {
  editMode: EditMode;
  backgroundColor?: string;
  similarPrayers: PartialLinkedPrayerEntity[];
  prayerPoint: PrayerPoint;
  onChange: (selectedPrayer: LinkedPrayerEntity, title: string) => void;
}): JSX.Element {
  const [searchText, setSearchText] = useState('');
  const [selectedLink, setSelectedLink] = useState<LinkedPrayerEntity | null>(
    null,
  );
  const [label, setLabel] = useState('Link to Prayer');
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const textColor = useThemeColor({ light: Colors.link }, 'textPrimary');
  const titleColor = useThemeColor({}, 'textPrimary');
  const [showLinkSection, setShowLinkSection] = useState(true);

  const determineLabel = (prayer: LinkedPrayerEntity | null): string => {
    if (!prayer) return 'Link to Prayer';
    if (prayer.id === selectedLink?.id) return 'Linked';

    switch (prayer.entityType) {
      case EntityType.PrayerPoint:
        return 'Link to Prayer Point';
      case EntityType.PrayerTopic:
        return 'Link to #Topic';
      default:
        return 'Link to Prayer';
    }
  };

  const handlePrayerSelection = (prayer: LinkedPrayerEntity | null) => {
    const newLabel = determineLabel(prayer);
    setLabel(newLabel);
  };

  const handleAddTopic = async (
    title: string,
    selectedPrayer: LinkedPrayerEntity,
  ) => {
    onChange(selectedPrayer as LinkedPrayerEntity, title);
    handlePrayerSelection(selectedPrayer);
  };

  const handleOpenModal = (prayer: LinkedPrayerEntity) => {
    setSelectedLink(prayer);
    setShowLinkingModal(true);
  };

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: backgroundColor, borderColor: Colors.grey1 },
      ]}
    >
      {editMode === EditMode.CREATE && (
        <>
          <View style={styles.modalHeader}>
            <Text style={{ ...styles.modalTitle, color: titleColor }}>
              Link to an Existing Prayer
            </Text>
            <TouchableOpacity
              onPress={() => setShowLinkSection(!showLinkSection)}
            >
              <Text style={{ ...styles.expandTitle, color: textColor }}>
                {showLinkSection ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          {showLinkSection && (
            <View style={styles.linkContainer}>
              {similarPrayers.slice(0, 3).map((prayer, index) => {
                const typedPrayer = prayer as LinkedPrayerEntity;
                return (
                  <PrayerCardWithButtons
                    key={index}
                    prayer={typedPrayer} // Type assertion
                    button1={{
                      label: label,
                      onPress: () => handleOpenModal(typedPrayer),
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
        </>
      )}

      {/* Display LinkingModal when showLinkingModal is true */}
      {selectedLink && setShowLinkingModal && (
        <LinkPrayerModal
          visible={showLinkingModal}
          onClose={() => setShowLinkingModal(false)}
          onAddTopic={(title, selectedLink) => {
            handleAddTopic(title, selectedLink);
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
