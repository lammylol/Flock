import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { PrayerPoint, PrayerTopic } from '@/types/firebase';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { EditMode } from '@/types/ComponentProps';
import PrayerCardWithButtons from './PrayerCardWithButtons';
import LinkPrayerModal from './LinkPrayerModal';

export function PrayerPointLinking({
  editMode,
  backgroundColor,
  similarPrayers,
  prayerPoint,
}: {
  editMode: EditMode;
  backgroundColor?: string;
  similarPrayers: PrayerPoint[];
  prayerPoint: PrayerPoint;
  onChange?: (updatedPrayerPoint: PrayerPoint) => void;
}): JSX.Element {
  // const { userPrayers, userPrayerPoints } = usePrayerCollection();
  const [searchText, setSearchText] = useState('');
  const [selectedLink, setSelectedLink] = useState<
    PrayerPoint | PrayerTopic | null
  >(null);
  const [showLinkingModal, setShowLinkingModal] = useState(false);
  const textColor = useThemeColor({ light: Colors.link }, 'textPrimary');
  const titleColor = useThemeColor({}, 'textPrimary');
  const [showLinkSection, setShowLinkSection] = useState(true);

  const handleSetLinkedPrayerandOpenModal = (
    prayer: PrayerPoint | PrayerTopic,
  ) => {
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
              {similarPrayers.slice(0, 2).map((prayerPoint, index) => (
                <PrayerCardWithButtons
                  key={index}
                  prayer={prayerPoint}
                  button1={{
                    label: 'Link and Create #Topic',
                    onPress: () =>
                      handleSetLinkedPrayerandOpenModal(prayerPoint),
                  }}
                ></PrayerCardWithButtons>
              ))}
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
          onAddTopic={(title) => {
            // Handle adding a new topic here
            console.log('New Topic Title:', title);
          }}
          originPrayer={selectedLink}
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
