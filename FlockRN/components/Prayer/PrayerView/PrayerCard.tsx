import { ThemedText } from '@/components/ThemedText';
import { Prayer } from '@/types/firebase';
import { router } from 'expo-router';
import {
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import Button from '@/components/Button';

export interface PrayerCardProps {
  prayer: Prayer;
}

export default function PrayerCard({ prayer }: PrayerCardProps): JSX.Element {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <TouchableOpacity
      style={[
        styles.prayerContainer,
        // { backgroundColor: Colors[colorScheme].background },
        { backgroundColor: 'red' },
      ]}
      onPress={() => {
        router.push({
          pathname: '/prayers/prayerView',
          params: { id: prayer.id },
        });
      }}
    >
      <ThemedText style={styles.title}>{prayer.title}</ThemedText>
      <ThemedText numberOfLines={1} ellipsizeMode="tail" style={styles.content}>
        {prayer.content}
      </ThemedText>
      <View style={styles.actionBar}>
        <Button label={'Share'} onPress={() => {}} size="xs" />
        <Button label={'Pray!'} onPress={() => {}} size="xs" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // eslint-disable-next-line react-native/no-color-literals
  prayerContainer: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    padding: 10,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5, // Space between title and content
  },
  content: {
    fontSize: 14,
    color: 'gray', // Lighter color for the content
    marginBottom: 5, // Space at the bottom
  },

  // eslint-disable-next-line react-native/no-color-literals
  actionBar: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
