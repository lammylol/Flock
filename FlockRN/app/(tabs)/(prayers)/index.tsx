import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { Prayer, PrayerPoint } from '@/types/firebase';
import { useFocusEffect } from '@react-navigation/native';
import PrayerCard from '@/components/Prayer/PrayerViews/PrayerCard';
import { Tabs } from '@/components/Tab';
import SearchBar from '@/components/ui/SearchBar';
import { FloatingAddPrayerButton } from '@/components/Prayer/PrayerViews/FloatingAddPrayerButton';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';
import { useState } from 'react';

type TabType = 'prayerPoints' | 'userPrayers';

export default function TabTwoScreen() {
  const {
    userPrayers,
    userPrayerPoints,
    filteredUserPrayers,
    filteredUserPrayerPoints,
    loadAll,
    searchPrayers,
  } = usePrayerCollection();

  const [selectedTab, setSelectedTab] = useState<TabType>('userPrayers');

  useFocusEffect(loadAll);

  return (
    <ThemedView style={styles.container}>
      <ThemedScrollView style={styles.scrollView} onRefresh={loadAll}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">My Prayers</ThemedText>
        </ThemedView>
        <ThemedView>
          <SearchBar
            placeholder={`Search ${selectedTab === 'prayerPoints' ? 'Prayer Points' : 'Prayers'}`}
            onSearch={searchPrayers}
          />
          <Tabs
            tabs={[
              `Prayer Points (${userPrayerPoints.length})`,
              `Prayers (${userPrayers.length})`,
            ]}
            selectedIndex={selectedTab === 'prayerPoints' ? 0 : 1}
            onChange={(index) =>
              setSelectedTab(index === 0 ? 'prayerPoints' : 'userPrayers')
            }
          />
          {selectedTab === 'prayerPoints' && (
            <ThemedScrollView>
              {filteredUserPrayerPoints.map((prayerPoint: PrayerPoint) => (
                <PrayerCard prayer={prayerPoint} />
              ))}
            </ThemedScrollView>
          )}
          {selectedTab === 'userPrayers' && (
            <ThemedScrollView>
              {filteredUserPrayers.map((prayer: Prayer) => (
                <PrayerCard prayer={prayer} />
              ))}
            </ThemedScrollView>
          )}
        </ThemedView>
      </ThemedScrollView>
      <FloatingAddPrayerButton
        label="+Add Prayer"
        route={'/(tabs)/(prayers)/(createPrayer)'}
        bottom={80}
        right={30}
      />
      <FloatingAddPrayerButton
        label="+Add Prayer Point"
        route={'/(tabs)/(prayers)/(createPrayerPoint)'}
        bottom={25}
        right={30}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    padding: 32,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
