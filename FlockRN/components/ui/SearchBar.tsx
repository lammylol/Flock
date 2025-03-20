import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { debounce } from 'lodash';

export type SearchBarProps = {
  placeholder?: string;
  onSearch: (searchText: string) => void;
};
export default function SearchBar({
  placeholder = 'Search',
  onSearch,
}: SearchBarProps): JSX.Element {
  const [searchText, setSearchText] = useState('');

  const handleDebouncedSearch = debounce((text: string) => {
    onSearch(text);
  }, 500);

  const onChangeText = (text: string) => {
    setSearchText(text);
    handleDebouncedSearch(text);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={searchText}
        onChangeText={onChangeText}
        clearButtonMode="while-editing"
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1,
    flexDirection: 'row',
    height: 40,
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingLeft: 10, // Push text to start after the curve
  },
});
