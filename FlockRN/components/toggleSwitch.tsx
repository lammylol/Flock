import React from 'react';
import { View, TouchableOpacity } from 'react-native';

interface ToggleSwitchProps {
  isEnabled: boolean;
  onToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isEnabled, onToggle }) => {
  return (
    <TouchableOpacity
      onPress={onToggle}
      className={`w-12 h-6 rounded-full ${isEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
    >
      <View
        className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-all duration-200 ${
          isEnabled ? 'translate-x-6' : 'translate-x-1'
        } my-0.5`}
      />
    </TouchableOpacity>
  );
};

export default ToggleSwitch;
