/* eslint-disable react-native/no-color-literals */
/* eslint-disable react-native/no-inline-styles */
// Stack.tsx
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { ThemedView } from './ThemedView';

type Direction = 'row' | 'column';

interface MuiStackProps {
  children: React.ReactNode;
  spacing?: number;
  direction?: Direction;
  style?: ViewStyle;
  [key: string]: unknown; // Allow other optional props
}

const MuiStack: React.FC<MuiStackProps> = ({
  children,
  spacing = 8,
  direction = 'column',
  style,
  ...rest
}) => {
  const childrenArray = React.Children.toArray(children);

  return (
    <ThemedView style={[{ flexDirection: direction }, style]} {...rest}>
      {childrenArray.map((child, index) => (
        <View
          key={index}
          style={
            index < childrenArray.length - 1
              ? direction === 'row'
                ? { marginRight: spacing, backgroundColor: 'transparent' }
                : { marginBottom: spacing, backgroundColor: 'transparent' }
              : undefined
          }
        >
          {child}
        </View>
      ))}
    </ThemedView>
  );
};

export default MuiStack;
