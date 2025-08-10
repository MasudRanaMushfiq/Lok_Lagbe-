import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,  // hide header inside tabs screens
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'index') iconName = 'home-outline';
          else if (route.name === 'hire') iconName = 'briefcase-outline';
          else if (route.name === 'works') iconName = 'list-outline';
          else if (route.name === 'profile') iconName = 'person-outline';
          else iconName = 'ellipse-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ff6347',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
        },
      })}
    />
  );
}
