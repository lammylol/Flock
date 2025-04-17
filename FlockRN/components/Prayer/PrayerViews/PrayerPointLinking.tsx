import { useEffect, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';
import { PrayerPoint } from '@/types/firebase';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

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
  const { userPrayers, userPrayerPoints } = usePrayerCollection();
  const [searchText, setSearchText] = useState('');
  const [selectedLink, setSelectedLink] = useState<PrayerPoint | null>(null);
  const textColor = useThemeColor({ light: Colors.link }, 'textPrimary');
  const titleColor = useThemeColor({}, 'textPrimary');
  const [showLinkSection, setShowLinkSection] = useState(true);

  useEffect(() => {
    if (selectedLink && onChange) {
      onChange(selectedLink);
    }
  }, [selectedLink]);

  const filteredPrayerPoints = userPrayerPoints.filter((point) =>
    point.title.toLowerCase().includes(searchText.toLowerCase()),
  );

  const handleSelectPrayerPoint = (point: PrayerPoint) => {
    setSelectedLink(point);
  };

  const handleSearch = (text: string) => {
    // function
    // setData
  };

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
            <>
              {similarPrayers.slice(0, 2).map((prayer, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestedCard}
                  onPress={() => handleSelectPrayerPoint(prayer)}
                >
                  <Text
                    style={styles.suggestedCardText}
                  >{`${prayer.type}: ${prayer.title}`}</Text>
                </TouchableOpacity>
              ))}
              <TextInput
                style={styles.searchInput}
                placeholder="Search existing prayer points..."
                value={searchText}
                onChangeText={setSearchText}
              />
            </>
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
  linkSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  searchInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  prayerPointItem: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 5,
  },
  selectedPrayerPoint: {
    backgroundColor: '#d0e6ff',
  },
  container: {
    borderRadius: 15,
    borderWidth: 2,
    gap: 15,
    padding: 16,
    width: '100%', // Make it responsive to parent width
  },
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: 'absolute',
    backgroundColor: 'white',
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  suggestedCard: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e0f7fa',
    marginBottom: 10,
  },
  suggestedCardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#00796b',
  },
});

export default PrayerPointLinking;
