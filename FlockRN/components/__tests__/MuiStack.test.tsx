import React from 'react';
import { render } from '@testing-library/react-native';
import MuiStack from '../MuiStack';
import { Text } from 'react-native';
import { StyleSheet, ViewStyle } from 'react-native';

const flattenStyle = (style: ViewStyle | ViewStyle[] | undefined) =>
  StyleSheet.flatten(style || {});

describe('MuiStack', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <MuiStack>
        <Text>Child 1</Text>
        <Text>Child 2</Text>
      </MuiStack>,
    );

    expect(getByText('Child 1')).toBeTruthy();
    expect(getByText('Child 2')).toBeTruthy();
  });

  it('applies custom styles to the MuiStack', () => {
    const { getByTestId } = render(
      <MuiStack testID="mui-stack" style={{ backgroundColor: 'red' }}>
        <Text>Child</Text>
      </MuiStack>,
    );

    expect(flattenStyle(getByTestId('mui-stack').props.style)).toMatchObject({
      backgroundColor: 'red',
    });
  });
});
