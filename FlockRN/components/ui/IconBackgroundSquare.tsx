import { Colors } from '@/constants/Colors';
import { EntityType, PrayerType } from '@/types/PrayerSubtypes';
import { StyleSheet, View, Text } from 'react-native';

export const prayerTypeEmojis = {
  request: '🙏',
  praise: '🙌',
  repentance: '🫴',
};

export interface IconBackgroundSquare {
  entityType: EntityType;
  type?: PrayerType; // only used for prayer points
  customValue?: string;
  customBackground?: string;
}

export const IconBackgroundSquare: React.FC<IconBackgroundSquare> = ({
  entityType,
  type,
  customValue,
  customBackground,
}) => {
  let backgroundColor: string;
  let emoji: string;

  // Logic to determine background color and emoji using a switch statement
  switch (true) {
    case !!entityType && entityType === EntityType.PrayerPoint && !!type:
      backgroundColor = Colors.iconBackgroundColors.typeColors[type];
      emoji = prayerTypeEmojis[type];
      break;
    case !!customValue:
      backgroundColor =
        customBackground ?? Colors.iconBackgroundColors.defaultTag;
      emoji = customValue;
      break;
    default:
      // Default background and emoji for PrayerTopic
      backgroundColor =
        customBackground ?? Colors.iconBackgroundColors.defaultTag;
      emoji = '#️⃣'; // Default emoji for PrayerTopic
      break;
  }

  return (
    <View style={[styles.background, { backgroundColor: backgroundColor }]}>
      <Text style={styles.text}>{emoji}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    alignItems: 'center',
    borderRadius: 6,
    height: 45,
    justifyContent: 'center',
    width: 45,
  },
  // eslint-disable-next-line react-native/no-color-literals
  text: {
    color: 'black',
    fontSize: 20,
  },
});
