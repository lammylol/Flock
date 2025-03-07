import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface Tag {
  id: string;
  label: string;
}

interface TagsSectionProps {
  tags: Tag[];
  onTagPress?: (tag: Tag) => void;
}

const TagsSection: React.FC<TagsSectionProps> = ({ tags, onTagPress }) => {
  return (
    <View className="mt-4">
      <Text className="text-gray-700 mb-2">Tags:</Text>
      <View className="flex-row flex-wrap gap-2">
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag.id}
            onPress={() => onTagPress?.(tag)}
            className="bg-gray-100 rounded-full px-3 py-1"
          >
            <Text className="text-sm text-gray-800">{tag.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default TagsSection;