import { ThemedText } from '@/components/ThemedText';
import { Prayer, PrayerPoint, PrayerTopic } from '@/types/firebase';
import {
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { EmojiIconBackground } from '@/components/ui/EmojiIconBackground';
import { prayerTagDisplayNames } from '@/types/Tag';
import { useMemo } from 'react';
import { getEntityType } from '@/types/typeGuards';

export interface PrayerCardProps {
  prayer: Prayer | PrayerPoint | PrayerTopic;
}

export default function PrayerCard({ prayer }: PrayerCardProps): JSX.Element {
  const colorScheme = useColorScheme() ?? 'light';

  const formattedDate = (() => {
    if (!prayer?.createdAt) return 'Unknown Date'; // Handle missing date

    const date =
      prayer.createdAt instanceof Date
        ? prayer.createdAt
        : typeof prayer.createdAt === 'object' && 'seconds' in prayer.createdAt
          ? new Date(prayer.createdAt.seconds * 1000)
          : new Date(prayer.createdAt);

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  })();

  const entityType = useMemo(() => {
    return getEntityType(prayer);
  }, [prayer]);

  console.log('entityType', entityType);

  // Use the entityType to create the boolean checks
  const isPrayerPoint = entityType === 'prayerPoint';

  return (
    <TouchableOpacity
      style={[
        styles.prayerContainer,
        { backgroundColor: Colors[colorScheme].background },
      ]}
      onPress={() => {
        if (isPrayerPoint) {
          // If it's a PrayerPoint, navigate to PrayerPointView
          router.push({
            pathname: '/(tabs)/(prayers)/prayerPointView',
            params: { id: prayer.id },
          });
        } else {
          // If it's a Prayer, navigate to PrayerView
          router.push({
            pathname: '/(tabs)/(prayers)/prayerView',
            params: { id: (prayer as Prayer).id },
          });
        }
      }}
    >
      <View style={styles.headerContainer}>
        {isPrayerPoint && 'type' in prayer && (
          <EmojiIconBackground type={prayer.type} />
        )}
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title}>
            {isPrayerPoint ? prayer.title : formattedDate}
          </ThemedText>
          {isPrayerPoint && 'type' in prayer && (
            <ThemedText
              style={[
                styles.subtitle,
                { color: Colors[colorScheme].textSecondary },
              ]}
            >
              {(prayerTagDisplayNames[prayer.type]?.charAt(0).toUpperCase() ??
                '') + (prayerTagDisplayNames[prayer.type]?.slice(1) ?? '')}
            </ThemedText>
          )}
        </View>
      </View>
      {prayer.content && (
        <ThemedText
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.preview}
        >
          {prayer.content}
        </ThemedText>
      )}
      {/* Saving to add Later! */}
      {/* {'type' in prayer && (
        <View style={styles.actionBar}>
          <Button
            label={'Share'}
            onPress={() => {}}
            size="s"
            flex={1}
            textProps={{ fontSize: 14, fontWeight: 'semibold' }}
            startIcon={
              <IconSymbol
                name="square.and.arrow.up"
                color={Colors[colorScheme].textPrimary}
                size={16}
              />
            }
            backgroundColor={Colors.grey1}
          />
          <Button
            label={'🙏 Pray!'}
            onPress={() => {}}
            size="s"
            flex={1}
            textProps={{ fontSize: 14, fontWeight: 'semibold' }}
            backgroundColor={Colors.brown1}
          />
        </View>
      )} */}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // actionBar: {
  //   backgroundColor: 'transparent',
  //   flexDirection: 'row',
  //   flex: 1,
  //   gap: 15,
  // },
  headerContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'column',
    gap: 2,
    flex: 1,
  },
  // eslint-disable-next-line react-native/no-color-literals
  prayerContainer: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    width: '100%',
    gap: 7,
    paddingVertical: 7,
  },
  preview: {
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
  },
});
