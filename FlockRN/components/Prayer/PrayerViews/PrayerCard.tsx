import { ThemedText } from '@/components/ThemedText';
import { Prayer, PrayerPoint } from '@/types/firebase';
import {
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import Button from '@/components/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { router } from 'expo-router';

export interface PrayerCardProps {
  prayer: Prayer | PrayerPoint;
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

  return (
    <TouchableOpacity
      style={[
        styles.prayerContainer,
        { backgroundColor: Colors[colorScheme].background },
      ]}
      onPress={() => {
        if ('prayerId' in prayer) {
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
      <ThemedText style={styles.title}>
        {'prayerId' in prayer ? prayer.title : formattedDate}
      </ThemedText>
      <ThemedText numberOfLines={1} ellipsizeMode="tail" style={styles.preview}>
        {prayer.content}
      </ThemedText>
      {'prayerId' in prayer && (
        <View style={styles.actionBar}>
          <Button
            label={'Share'}
            onPress={() => { }}
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
            onPress={() => { }}
            size="s"
            flex={1}
            textProps={{ fontSize: 14, fontWeight: 'semibold' }}
            backgroundColor={Colors.brown3}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // eslint-disable-next-line react-native/no-color-literals
  actionBar: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    flex: 1,
    gap: 15,
  },
  // eslint-disable-next-line react-native/no-color-literals
  prayerContainer: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 7,
    width: '100%',
  },
  preview: {
    fontSize: 14,
    marginBottom: 13,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 3, // Space between title and content
  },
});
