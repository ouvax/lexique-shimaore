import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import AuthLoadingScreen from './screens/AuthLoadingScreen';
import LoginScreen from './screens/LoginScreen';
import BottomTabs from './navigation/BottomTabs';
import { darkColors, lightColors } from './theme';

import { ThemeProvider, useThemeMode } from './ThemeContext';

const Stack = createStackNavigator();

function MainApp() {
  const { theme } = useThemeMode();
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
        <Stack.Screen name="Home" component={BottomTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
