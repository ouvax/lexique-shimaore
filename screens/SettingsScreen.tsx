import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { SafeAreaView } from 'react-native-safe-area-context';

import TextTitle from '../components/TextTitle';
import PrimaryButton from '../components/PrimaryButton';
import Section from '../components/Section';
import { useThemeMode } from '../ThemeContext';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [quizTimer, setQuizTimer] = useState<number>(10);
  const [savedMessage, setSavedMessage] = useState('');

  const { mode, setMode } = useThemeMode();

  useEffect(() => {
    const loadSettings = async () => {
      const notif = await AsyncStorage.getItem('notificationsEnabled');
      const timer = await AsyncStorage.getItem('quizTimer');
      if (notif !== null) setNotificationsEnabled(notif === 'true');
      if (timer !== null) setQuizTimer(parseInt(timer));
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    await AsyncStorage.setItem('notificationsEnabled', notificationsEnabled.toString());
    await AsyncStorage.setItem('quizTimer', quizTimer.toString());
    setSavedMessage('✅ Paramètres enregistrés !');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Erreur', "Impossible de se déconnecter.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TextTitle>⚙️ Paramètres</TextTitle>

      <Section title="⏱ Temps pour répondre au quiz">
        <View style={styles.timerButtons}>
          {[10, 15, 20].map((value) => (
            <PrimaryButton
              key={value}
              title={`${value} sec`}
              onPress={() => setQuizTimer(value)}
              disabled={quizTimer === value}
            />
          ))}
        </View>
      </Section>

      <Section title="🔔 Notifications">
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Activer les rappels quotidiens
          </Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={notificationsEnabled ? '#fff' : '#ccc'}
          />
        </View>
      </Section>

      <Section title="🌓 Apparence">
        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text }]}>
            Activer le mode sombre
          </Text>
          <Switch
            value={mode === 'dark'}
            onValueChange={(val) => setMode(val ? 'dark' : 'light')}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={mode === 'dark' ? '#fff' : '#ccc'}
          />
        </View>
      </Section>

      <PrimaryButton title="Enregistrer les paramètres" onPress={handleSave} />

      {savedMessage ? (
        <Text style={[styles.confirmation, { color: colors.primary }]}>
          {savedMessage}
        </Text>
      ) : null}

      <View style={{ marginTop: 32 }}>
        <PrimaryButton title="🚪 Se déconnecter" onPress={handleLogout} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  timerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  switchLabel: {
    fontSize: 16,
  },
  confirmation: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});
