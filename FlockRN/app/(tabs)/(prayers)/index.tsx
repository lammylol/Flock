import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedScrollView } from '@/components/ThemedScrollView';
import { Prayer, PrayerPoint, PrayerTopic } from '@/types/firebase';
import { useFocusEffect } from '@react-navigation/native';
import EditablePrayerCard from '@/components/Prayer/PrayerViews/PrayerCard';
import { Tabs } from '@/components/Tab';
import SearchBar from '@/components/ui/SearchBar';
import { FloatingAddPrayerButton } from '@/components/Prayer/PrayerViews/FloatingAddPrayerButton';
import { usePrayerCollection } from '@/context/PrayerCollectionContext';
import { useState } from 'react';

type TabType = 'prayerTopics' | 'prayerPoints' | 'userPrayers';

export default function TabTwoScreen() {
  const {
    userPrayers,
    userPrayerPoints,
    userPrayerTopics,
    filteredUserPrayers,
    filteredUserPrayerPoints,
    filteredUserPrayerTopics,
    loadAll,
    searchPrayers,
  } = usePrayerCollection();

  const [selectedTab, setSelectedTab] = useState<TabType>('prayerTopics');

  useFocusEffect(loadAll);

  return (
    <ThemedView style={styles.container}>
      <ThemedScrollView style={styles.scrollView} onRefresh={loadAll}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">My Prayers</ThemedText>
        </ThemedView>
        <ThemedView>
          <SearchBar
            placeholder={`Search ${
              selectedTab === 'prayerTopics'
                ? 'Prayer Topics'
                : selectedTab === 'prayerPoints'
                  ? 'Prayer Points'
                  : 'Prayers'
            }`}
            onSearch={searchPrayers}
          />
          <Tabs
            tabs={[
              `Prayer Topics (${userPrayerTopics.length})`,
              `Prayer Points (${userPrayerPoints.length})`,
              `Prayers (${userPrayers.length})`,
            ]}
            selectedIndex={
              selectedTab === 'prayerTopics'
                ? 0
                : selectedTab === 'prayerPoints'
                  ? 1
                  : 2
            }
            onChange={(index) => {
              const tabMap: TabType[] = [
                'prayerTopics',
                'prayerPoints',
                'userPrayers',
              ];
              setSelectedTab(tabMap[index]);
            }}
          />
          {selectedTab === 'prayerTopics' && (
            <ThemedScrollView>
              {filteredUserPrayerTopics.map((topic: PrayerTopic) => (
                <EditablePrayerCard
                  key={topic.id}
                  prayer={topic}
                  editable={false}
                />
              ))}
            </ThemedScrollView>
          )}
          {selectedTab === 'prayerPoints' && (
            <ThemedScrollView>
              {filteredUserPrayerPoints.map((prayerPoint: PrayerPoint) => (
                <EditablePrayerCard
                  key={prayerPoint.id}
                  prayer={prayerPoint}
                  editable={false}
                />
              ))}
            </ThemedScrollView>
          )}
          {selectedTab === 'userPrayers' && (
            <ThemedScrollView>
              {filteredUserPrayers.map((prayer: Prayer) => (
                <EditablePrayerCard
                  key={prayer.id}
                  prayer={prayer}
                  editable={false}
                />
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
        route={'/(tabs)/(prayers)/createPrayerPoint'}
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
