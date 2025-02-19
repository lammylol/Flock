import { Text, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>About Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.light.darkBg, // Using the darkBg color we added
    flex: 1,
    justifyContent: 'center',
  },
  text: {
    color: Colors.dark.text,
  },
});
