import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthLoadingScreen from './screens/AuthLoadingScreen';
import LoginScreen from './screens/LoginScreen';
import BottomTabs from './navigation/BottomTabs';
import { darkColors, lightColors } from './theme';

const Stack = createStackNavigator();

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      const stored = await AsyncStorage.getItem('theme');
      if (stored === 'dark') {
        setTheme('dark');
      } else {
        setTheme('light');
      }
      setIsReady(true);
    };
    loadTheme();
  }, []);

  if (!isReady) return null; // ⏳ Attendre que le thème soit chargé

  const isDarkMode = theme === 'dark';

  const customTheme = {
    ...(isDarkMode ? NavDarkTheme : DefaultTheme),
    colors: isDarkMode ? darkColors : lightColors,
  };

  return (
    <NavigationContainer theme={customTheme}>
      <Stack.Navigator initialRouteName="AuthLoading" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Lexique" component={BottomTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
