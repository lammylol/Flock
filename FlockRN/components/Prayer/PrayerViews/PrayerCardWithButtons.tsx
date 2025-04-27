import { ThemedView } from '@/components/ThemedView';
import PrayerCard from './PrayerCard';
import Button from '@/components/Button';
import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Prayer, PrayerPoint, PrayerTopic } from '@/types/firebase';
import { PrayerCardButtonProps } from '@/types/ComponentProps';

export interface PrayerCardWithButtonProps {
  prayer: Prayer | PrayerPoint | PrayerTopic;
  button1: PrayerCardButtonProps;
  button2?: PrayerCardButtonProps;
}

export default function PrayerCardWithButtons({
  prayer,
  button1,
  button2,
}: PrayerCardWithButtonProps): JSX.Element {
  return (
    <PrayerCard prayer={prayer}>
      <ThemedView style={styles.actionBar}>
        <Button
          label={button1.label}
          onPress={button1.onPress}
          size="s"
          flex={1}
          textProps={{ fontSize: 14, fontWeight: 'semibold' }}
          backgroundColor={Colors.grey1}
        />
        {button2 && (
          <Button
            label={button2.label}
            onPress={button2.onPress}
            size="s"
            flex={1}
            textProps={{ fontSize: 14, fontWeight: 'semibold' }}
            backgroundColor={Colors.brown1}
          />
        )}
        {/* <Button
          label={'Link and Create #Topic'}
          onPress={() => { }}
          size="s"
          flex={1}
          textProps={{ fontSize: 14, fontWeight: 'semibold' }}
          backgroundColor={Colors.grey1}
        /> */}
        {/* <Button
          label={'🙏 Pray!'}
          onPress={() => { }}
          size="s"
          flex={1}
          textProps={{ fontSize: 14, fontWeight: 'semibold' }}
          backgroundColor={Colors.brown1}
        /> */}
      </ThemedView>
    </PrayerCard>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    flex: 1,
    gap: 15,
  },
});
