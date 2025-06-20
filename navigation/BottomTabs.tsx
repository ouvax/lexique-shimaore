import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';

import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import QuizStack from './QuizStack';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Lexique"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#888',
        tabBarIcon: ({ color, size }) => {
          let iconName: string = 'home';

          if (route.name === 'Lexique') iconName = 'book';
          else if (route.name === 'Quiz') iconName = 'help-circle';
          else if (route.name === 'Paramètres') iconName = 'settings';

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Lexique" component={HomeScreen} />
      <Tab.Screen name="Quiz" component={QuizStack} />
      <Tab.Screen name="Paramètres" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
