import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import introFlowBackground from '../../assets/images/introFlowBackground.png';
import { Colors } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

const IntroScreen = () => {
  const [index, setIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const handleNext = () => {
    if (index < 1) {
      Animated.timing(translateX, {
        toValue: -(index + 1) * width,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setIndex(index + 1));
    }
  };

  const handleGetStarted = () => {
    router.replace('/auth/login');
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {[0, 1].map((i) => (
        <View
          key={i}
          style={[
            styles.dot,
            index === i ? styles.activeDot : styles.defaultDot,
          ]}
        />
      ))}
    </View>
  );

  const parallaxTranslate = translateX.interpolate({
    inputRange: [-width, 0],
    outputRange: [-width * 0.3, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Parallax background image */}
      <Animated.Image
        source={introFlowBackground}
        style={[
          styles.backgroundImage,
          { transform: [{ translateX: parallaxTranslate }] },
        ]}
        resizeMode="cover"
        blurRadius={2}
      />

      {/* Slide panels */}
      <Animated.View style={[styles.slider, { transform: [{ translateX }] }]}>
        {/* Pane 1 */}
        <View style={styles.pane}>
          <Text style={styles.title}>Your Privacy Matters</Text>
          <Text style={styles.text}>
            We value your privacy and ensure your data is protected at every
            step.
          </Text>
        </View>

        {/* Pane 2 */}
        <View style={styles.pane}>
          <Text style={styles.title}>Smarter with AI</Text>
          <Text style={styles.text}>
            Our app integrates AI to provide personalized and intelligent
            experiences.
          </Text>
        </View>
      </Animated.View>

      {/* Progress Dots */}
      {renderDots()}

      {/* Buttons */}
      <TouchableOpacity
        style={styles.button}
        onPress={index === 0 ? handleNext : handleGetStarted}
      >
        <Text style={styles.buttonText}>
          {index === 0 ? 'Next' : 'Get Started'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default IntroScreen;

const styles = StyleSheet.create({
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: width * 1.5, // wider for parallax effect
    height: height,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    marginBottom: 40,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  buttonText: {
    color: Colors.light.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    backgroundColor: Colors.dark.background, // fallback
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  dot: {
    borderRadius: 5,
    height: 10,
    marginHorizontal: 5,
    width: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  pane: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 30,
    paddingBottom: 150,
    width,
  },
  slider: {
    flexDirection: 'row',
    height: '100%',
    width: width,
  },
  text: {
    color: Colors.light.textPrimary,
    fontSize: 18,
    lineHeight: 26,
  },
  title: {
    color: Colors.light.textPrimary,
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 20,
  },
  defaultDot: {
    backgroundColor: Colors.white,
    opacity: 0.5,
  },
  activeDot: {
    backgroundColor: Colors.primary,
    opacity: 1,
  },
});
