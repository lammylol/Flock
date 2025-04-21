import { useEffect, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { PrayerPoint } from '@/types/firebase';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import PrayerCard from './PrayerCard';

export function PrayerPointLinking({
  editMode,
  backgroundColor,
  similarPrayers,
  onChange,
}: {
  editMode: 'create' | 'edit' | 'view';
  backgroundColor?: string;
  similarPrayers: PrayerPoint[];
  onChange?: (updatedPrayerPoint: PrayerPoint) => void;
}): JSX.Element {
  // const { userPrayers, userPrayerPoints } = usePrayerCollection();
  const [searchText, setSearchText] = useState('');
  const [selectedLink, setSelectedLink] = useState<PrayerPoint | null>(null);
  const textColor = useThemeColor({ light: Colors.link }, 'textPrimary');
  const titleColor = useThemeColor({}, 'textPrimary');
  const [showLinkSection, setShowLinkSection] = useState(true);

  useEffect(() => {
    if (selectedLink && onChange) {
      onChange(selectedLink);
    }
  }, [onChange, selectedLink]);

  // const filteredPrayerPoints = userPrayerPoints.filter((point) =>
  //   point.title.toLowerCase().includes(searchText.toLowerCase()),
  // );

  const handleSelectPrayerPoint = (point: PrayerPoint) => {
    setSelectedLink(point);
  };

  // const handleSearch = (text: string) => {
  //   // function
  //   // setData
  // };

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: backgroundColor, borderColor: Colors.grey1 },
      ]}
    >
      {editMode === 'create' && (
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
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSelectPrayerPoint(prayerPoint)}
                  style={styles.prayerCard}
                >
                  <PrayerCard prayer={prayerPoint}></PrayerCard>
                </TouchableOpacity>
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
