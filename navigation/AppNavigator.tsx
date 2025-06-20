import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

import LoginScreen from '../screens/LoginScreen';
import BottomTabs from './BottomTabs';
import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    requestNotificationPermission();
    scheduleDailyReminder();
  }, []);

  const requestNotificationPermission = async () => {
    if (Device.isDevice) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    }
  };

  const scheduleDailyReminder = async () => {
    const value = await AsyncStorage.getItem('notificationsEnabled');
    if (value !== 'true') return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 Révision Shimaoré',
        body: 'N’oublie pas ton quiz du jour ! 🇾🇹',
      },
      trigger: {
        type: 'calendar',
        hour: 18,
        minute: 0,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });
  };

  if (isAuthenticated === null) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={BottomTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
