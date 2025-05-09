import { useRef, useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import introFlowBackground from '@/assets/images/introFlowBackground.png';
import { Colors } from '@/constants/Colors';
import useUserContext from '@/hooks/useUserContext';
import { UserOptInFlags } from '@/types/UserFlags';
import { ThemedText } from '@/components/ThemedText';
import MuiStack from '@/components/MuiStack';

const { width, height } = Dimensions.get('window');

const screens = [
  {
    title: 'Your Privacy Matters',
    text: 'We value your privacy and ensure your data is protected at every step.',
  },
  {
    title: 'Data Storage',
    text: 'Your prayer data is stored in our secure servers. They are never accessed or shared without your consent.',
  },
  {
    title: 'Smarter with AI',
    text: 'Our app integrates AI to provide personalized and intelligent experiences.',
    optInFlag: UserOptInFlags.optInAI,
  },
  // Add more screens with custom components as needed
];

const IntroScreen = () => {
  const { userOptInFlags, toggleUserOptInFlagState } = useUserContext(); // Get flags and function from context
  const [index, setIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const handleNext = () => {
    if (index < screens.length - 1) {
      Animated.timing(translateX, {
        toValue: -(index + 1) * width,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setIndex(index + 1));
    }
  };

  const handleBack = () => {
    if (index > 0) {
      Animated.timing(translateX, {
        toValue: -(index - 1) * width,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setIndex(index - 1));
    }
  };

  const handleGetStarted = () => {
    router.replace('/auth/login');
  };

  const handleToggleUserOptInFlag = (flag: UserOptInFlags) => {
    toggleUserOptInFlagState(flag); // Toggle the opt-in flag state via context
  };

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {screens.map((_, i) => (
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
    inputRange: [-(screens.length - 1) * width, 0],
    outputRange: [-(screens.length - 1) * width * 0.3, 0],
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
        {screens.map((screen, i) => (
          <View key={i} style={styles.pane}>
            <Text style={styles.title}>{screen.title}</Text>
            <Text style={styles.text}>{screen.text}</Text>
            {screen.optInFlag && (
              <View style={styles.switchContainer}>
                <MuiStack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  style={styles.transparent}
                >
                  <ThemedText>Would you like to turn this on?</ThemedText>
                  <Switch
                    style={styles.transparent}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={
                      userOptInFlags[screen.optInFlag] ? '#f5dd4b' : '#f4f3f4'
                    }
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={() =>
                      handleToggleUserOptInFlag(screen.optInFlag)
                    }
                    value={userOptInFlags[screen.optInFlag] || false}
                  />
                </MuiStack>
              </View>
            )}
          </View>
        ))}
      </Animated.View>

      {/* Progress Dots */}
      {renderDots()}

      {/* Buttons Row */}
      <View style={styles.buttonsContainer}>
        {/* Back Button */}
        {index > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Centered Next / Get Started Button */}
        <TouchableOpacity
          style={styles.centeredButton}
          onPress={index === screens.length - 1 ? handleGetStarted : handleNext}
        >
          <Text style={styles.buttonText}>
            {index === screens.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    marginBottom: 40,
  },
  // eslint-disable-next-line react-native/no-color-literals
  backButton: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flex: 1,
    marginRight: 10, // Space between buttons
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredButton: {
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingHorizontal: 40,
    paddingVertical: 14,
    flex: 3, // Make sure it's centered
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchContainer: {
    marginTop: 20, // Add some spacing between text and switch
  },
  // eslint-disable-next-line react-native/no-color-literals
  transparent: {
    backgroundColor: 'transparent',
  },
});
