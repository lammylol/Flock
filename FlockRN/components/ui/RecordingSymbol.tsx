import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View, StyleSheet } from 'react-native';
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
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 100, // Makes it a perfect circle
    justifyContent: 'center',
  },
  icon: {
    color: Colors.purple,
    // opacity: 0.1,
  },
});

export default WaveForm;
