import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Button,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { signOut, User } from 'firebase/auth';
import { auth } from '../firebase';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const NOTIF_KEY = 'notificationsEnabled';
const TIMER_KEY = 'quizTimer';

export default function SettingsScreen() {
  const [enabled, setEnabled] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState<number>(10);
  const navigation = useNavigation<NavigationProp>();
  const user: User | null = auth.currentUser;

  useEffect(() => {
    loadSettings();

    // Redirige si l'utilisateur est déconnecté ailleurs
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    });

    return unsubscribe;
  }, []);

  const loadSettings = async () => {
    const notifValue = await AsyncStorage.getItem(NOTIF_KEY);
    if (notifValue === 'true') setEnabled(true);

    const timerValue = await AsyncStorage.getItem(TIMER_KEY);
    if (timerValue) setSelectedTimer(parseInt(timerValue));
  };

  const toggleSwitch = async () => {
    const newValue = !enabled;
    setEnabled(newValue);
    await AsyncStorage.setItem(NOTIF_KEY, newValue.toString());

    if (newValue) {
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
      Alert.alert('Notification activée');
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('Notification désactivée');
    }
  };

  const handleSelectTimer = async (value: number) => {
    setSelectedTimer(value);
    await AsyncStorage.setItem(TIMER_KEY, value.toString());
    Alert.alert('Temps enregistré', `${value} secondes sélectionnées`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Déconnecté', 'Vous avez été déconnecté.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Erreur', 'La déconnexion a échoué.');
    }
  };

  return (
    <View style={styles.container}>
      {user && (
        <Text style={styles.userInfo}>Connecté en tant que : {user.email}</Text>
      )}

      <Text style={styles.label}>Notification quotidienne</Text>
      <Switch value={enabled} onValueChange={toggleSwitch} />

      <View style={styles.section}>
        <Text style={styles.label}>⏱ Temps pour répondre au quiz</Text>
        <View style={styles.timerOptions}>
          {[10, 15, 20].map((value) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.timerButton,
                selectedTimer === value && styles.timerButtonSelected,
              ]}
              onPress={() => handleSelectTimer(value)}
            >
              <Text
                style={[
                  styles.timerText,
                  selectedTimer === value && styles.timerTextSelected,
                ]}
              >
                {value}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 40 }}>
        <Button title="Se déconnecter" onPress={handleLogout} color="#ef4444" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  userInfo: { fontSize: 16, marginBottom: 20, color: '#444' },
  label: { fontSize: 18, marginBottom: 10 },
  section: { marginTop: 30, alignItems: 'center' },
  timerOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  timerButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  timerButtonSelected: {
    backgroundColor: '#2563eb',
  },
  timerText: {
    fontSize: 16,
    color: '#2563eb',
  },
  timerTextSelected: {
    color: '#ffffff',
  },
});
