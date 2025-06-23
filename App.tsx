import React from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AuthLoadingScreen from './screens/AuthLoadingScreen';
import LoginScreen from './screens/LoginScreen';
import BottomTabs from './navigation/BottomTabs';
import { lightColors, darkColors } from './theme';

const Stack = createStackNavigator();

export default function App() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

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
