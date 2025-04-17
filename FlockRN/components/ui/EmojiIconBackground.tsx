import { Colors } from '@/constants/Colors';
import { PrayerType } from '@/types/PrayerSubtypes';
import { StyleSheet, View, Text } from 'react-native';

export interface EmojiIconBackgroundProps {
  type: PrayerType;
}

const emojiData = {
  request: '🙏',
  praise: '🙌',
  repentance: '🫴',
};

export const EmojiIconBackground: React.FC<EmojiIconBackgroundProps> = ({
  type,
}) => {
  return (
    <View
      style={[
        styles.background,
        { backgroundColor: Colors.iconBackgroundColors.typeColors[type] },
      ]}
    >
      <Text style={styles.text}>{emojiData[type]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    alignItems: 'center',
    borderRadius: 6,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  // eslint-disable-next-line react-native/no-color-literals
  text: {
    color: 'black',
    fontSize: 20,
  },
});
