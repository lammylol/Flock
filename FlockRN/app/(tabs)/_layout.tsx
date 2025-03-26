import { Tabs } from 'expo-router';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FontAwesome5 } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function TabLayout() {
  const colorScheme = useColorScheme() || 'light';
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].textPrimary,
        tabBarButton: HapticTab,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: backgroundColor,
          borderTopWidth: 0,
        },
      }}
      initialRouteName="(prayers)"
    >
      {/* <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      /> */}
      <Tabs.Screen
        name="(prayers)"
        options={{
          title: 'Prayer',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 color={color} size={21} name={'book'} />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="(createPrayer)"
        options={{
          title: 'Pray',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 color={color} size={21} name={'praying-hands'} />
          ),
        }}
      /> */}
      {/* <Tabs.Screen
        name="connections"
        options={{
          title: 'Connections',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 size={21} name={'user-friends'} color={color} />
          ),
        }}
      /> */}
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.circle.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
