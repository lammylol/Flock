import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScrollView from '@/components/ScrollView';
import { Prayer } from '@/types/firebase';
import useAuth from '@/hooks/useAuth';
import { useState } from 'react';
import { prayerService } from '@/services/prayer/prayerService';
import { Colors } from '@/constants/Colors';
import { useFocusEffect } from '@react-navigation/native';

export default function TabTwoScreen() {
  const { user } = useAuth();
  const [userPrayers, setUserPrayers] = useState<Prayer[]>([]);

  useFocusEffect(() => {
    const fetchPrayers = async () => {
      try {
        if (!user) return;
        const prayers = await prayerService.getUserPrayers(user.uid);
        setUserPrayers(prayers);
      } catch (error) {
        console.error('Error fetching prayers:', error);
      }
    };
    fetchPrayers();
  });
  return (
    <ScrollView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Prayers</ThemedText>
      </ThemedView>
      <ThemedView style={styles.container}>
        <ScrollView>
          {userPrayers.map((prayer: Prayer) => (
            <ThemedView
              key={prayer.id}
              style={{ flex: 1 }}
              lightColor={Colors.light.tabIconDefault}
              darkColor={Colors.dark.tabIconDefault}
            >
              <ThemedText>{prayer.title}</ThemedText>
              <ThemedText>{prayer.content}</ThemedText>
            </ThemedView>
          ))}
        </ScrollView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  imageStyle: {
    alignSelf: 'center',
  },
  monoText: {
    fontFamily: 'SpaceMono',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  container: {},
});

export default function TabTwoScreen() {
  const imageSource = Asset.fromModule(
    require('@/assets/images/react-logo.png'),
  );

  return (
    <ScrollView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Prayer</ThemedText>
      </ThemedView>
      <ThemedText>Prayers go here!</ThemedText>

      <Collapsible title="Images">
        {/* Use separate ThemedText components instead of nesting */}
        <ThemedText>For static images, you can use the</ThemedText>
        <ThemedText type="defaultSemiBold">@2x</ThemedText>
        <ThemedText>and</ThemedText>
        <ThemedText type="defaultSemiBold">@3x</ThemedText>
        <ThemedText>
          suffixes to provide files for different screen densities
        </ThemedText>

        <Image source={imageSource} style={styles.imageStyle} />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="Custom fonts">
        <ThemedText>Open</ThemedText>
        <ThemedText type="defaultSemiBold">app/_layout.tsx</ThemedText>
        <ThemedText>to see how to load</ThemedText>
        <ThemedText style={styles.monoText}>
          custom fonts such as this one.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/font">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>

      <Collapsible title="Animations">
        <ThemedText>
          This template includes an example of an animated component. The
        </ThemedText>
        <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText>
        <ThemedText>component uses the powerful</ThemedText>
        <ThemedText type="defaultSemiBold">react-native-reanimated</ThemedText>
        <ThemedText>library to create a waving hand animation.</ThemedText>
      </Collapsible>
    </ScrollView>
  );
}
