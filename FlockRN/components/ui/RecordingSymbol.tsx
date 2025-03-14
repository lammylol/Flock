import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

function WaveForm() {
  return (
    <View style={styles.circle}>
      <MaterialCommunityIcons name="waveform" size={24} style={styles.icon} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: 100, // Makes it a perfect circle
    // height: 50,
    // width: 50,
    alignItems: 'center',
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  icon: {
    color: Colors.purple,
    // opacity: 0.1,
  },
});

export default WaveForm;
