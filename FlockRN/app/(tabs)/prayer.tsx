import { StyleSheet, Image } from 'react-native';
import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ScrollView from '@/components/ScrollView';

const styles = StyleSheet.create({
  imageStyle: {
    alignSelf: 'center',
  },
  monoText: {
    fontFamily: 'SpaceMono',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});

export default function TabTwoScreen() {
  return (
    <ScrollView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Prayer</ThemedText>
      </ThemedView>
      <ThemedText>Prayers go here!</ThemedText>
      <Collapsible title="Images">
        <ThemedText>
          <ThemedText>For static images, you can use the </ThemedText>
          <ThemedText type="defaultSemiBold">@2x</ThemedText>
          <ThemedText> and </ThemedText>
          <ThemedText type="defaultSemiBold">@3x</ThemedText>
          <ThemedText>
            {' '}
            suffixes to provide files for different screen densities
          </ThemedText>
        </ThemedText>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={styles.imageStyle}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Custom fonts">
        <ThemedText>
          <ThemedText>Open </ThemedText>
          <ThemedText type="defaultSemiBold">app/_layout.tsx</ThemedText>
          <ThemedText> to see how to load </ThemedText>
          <ThemedText style={styles.monoText}>
            custom fonts such as this one.
          </ThemedText>
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/font">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animations">
        <ThemedText>
          <ThemedText>
            This template includes an example of an animated component. The{' '}
          </ThemedText>
          <ThemedText type="defaultSemiBold">
            components/HelloWave.tsx
          </ThemedText>
          <ThemedText> component uses the powerful </ThemedText>
          <ThemedText type="defaultSemiBold">
            react-native-reanimated
          </ThemedText>
          <ThemedText> library to create a waving hand animation.</ThemedText>
        </ThemedText>
      </Collapsible>
    </ScrollView>
  );
}
