import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface SettingsRowProps {
  title: string;
  rightElement?: ReactNode;
  onPress?: () => void;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  title,
  rightElement,
  onPress,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200"
      onPress={onPress}
    >
      <Text className="text-base text-gray-800">{title}</Text>
      {rightElement}
    </Container>
  );
};

export default SettingsRow;
