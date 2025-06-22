import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types'; // ← assure-toi que ce chemin est correct

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (auth.currentUser) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Lexique' }],
      });
    }
  }, []);

  const loadUserPreferences = async () => {
    const notifValue = await AsyncStorage.getItem('notificationsEnabled');
    const timerValue = await AsyncStorage.getItem('quizTimer');
    console.log('Préférences chargées :', { notifValue, timerValue });
  };

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await loadUserPreferences();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Lexique' }],
      });
    } catch (error: any) {
      let message = 'Une erreur est survenue.';
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Adresse email invalide.';
          break;
        case 'auth/user-disabled':
          message = 'Ce compte est désactivé.';
          break;
        case 'auth/user-not-found':
          message = 'Aucun utilisateur trouvé avec cet email.';
          break;
        case 'auth/wrong-password':
          message = 'Mot de passe incorrect.';
          break;
      }
      Alert.alert('Erreur', message);
    }
  };

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      await loadUserPreferences();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Lexique' }],
      });
    } catch (error: any) {
      let message = 'Impossible de créer le compte.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Cet email est déjà utilisé.';
          break;
        case 'auth/invalid-email':
          message = 'Adresse email invalide.';
          break;
        case 'auth/weak-password':
          message = 'Mot de passe trop faible (min. 6 caractères).';
          break;
      }
      Alert.alert('Erreur', message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <View style={styles.buttonContainer}>
        <Button title="Se connecter" onPress={handleLogin} color="#2563eb" />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Créer un compte" onPress={handleSignup} color="#10b981" />
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  buttonContainer: {
    marginTop: 10,
  },
});
