import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, User } from 'firebase/auth';

import HomeScreen from './screens/HomeScreen';
import SettingsScreen from './screens/SettingsScreen';
import QuizStack from './navigation/QuizStack';
import LoginScreen from './screens/LoginScreen';
import { auth } from './firebase';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
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

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
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
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
