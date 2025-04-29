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
import { IconBackgroundSquare } from '@/components/ui/IconBackgroundSquare';
import { prayerTagDisplayNames } from '@/types/Tag';
import { useMemo } from 'react';
import { getEntityType } from '@/types/typeGuards';
import { getPrayerType } from '@/utils/prayerUtils';

export interface PrayerCardProps {
  prayer: Prayer | PrayerPoint | PrayerTopic;
  children?: React.ReactNode;
}

export default function PrayerCard({
  prayer,
  children,
}: PrayerCardProps): JSX.Element {
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

  const prayerType = useMemo(() => {
    return getPrayerType(prayer);
  }, [prayer]);

  const entityType = useMemo(() => {
    return getEntityType(prayer);
  }, [prayer]);

  // Use the entityType to create the boolean checks
  const isPrayerPoint = entityType === 'prayerPoint';

  const handlePress = () => {
    if (entityType) {
      switch (entityType) {
        case 'prayerPoint':
          router.push({
            pathname: '/(tabs)/(prayers)/prayerPointView',
            params: { id: prayer.id },
          });
          break;
        case 'prayer':
          router.push({
            pathname: '/(tabs)/(prayers)/prayerView',
            params: { id: (prayer as Prayer).id },
          });
          break;
        case 'prayerTopic':
          router.push({
            pathname: '/(tabs)/(prayers)/prayerTopicView',
            params: { id: (prayer as PrayerTopic).id },
          });
          break;
        default:
          // Handle unknown entity type
          console.error('Unknown entity type:', entityType);
          return;
      }
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.prayerContainer,
        { backgroundColor: Colors[colorScheme].background },
      ]}
      onPress={() => {
        handlePress();
      }}
    >
      <View style={styles.headerContainer}>
        {isPrayerPoint && (
          <IconBackgroundSquare type={(prayer as PrayerPoint).prayerType} />
        )}
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title}>
            {isPrayerPoint ? prayer.title : formattedDate}
          </ThemedText>
          {isPrayerPoint && (
            <ThemedText
              style={[
                styles.subtitle,
                { color: Colors[colorScheme].textSecondary },
              ]}
            >
              {prayerType &&
                (prayerTagDisplayNames[prayerType]?.charAt(0).toUpperCase() ??
                  '') + (prayerTagDisplayNames[prayerType]?.slice(1) ?? '')}
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
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    width: '100%',
    paddingVertical: 10,
    gap: 15,
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
