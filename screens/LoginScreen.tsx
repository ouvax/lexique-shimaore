import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // ajuste le chemin si besoin
import AsyncStorage from '@react-native-async-storage/async-storage';

const loadUserPreferences = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const docRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();

    // Exemple : restaurer préférences locales
    if (data.preferences) {
      await AsyncStorage.setItem('notificationsEnabled', data.preferences.notificationsEnabled.toString());
      await AsyncStorage.setItem('quizTimer', data.preferences.quizTimer.toString());
    }

    // Autres préférences ou progressions à charger
  }
};


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginOrSignUp = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (error) {
        Alert.alert("Erreur", "Impossible de se connecter ou créer un compte.");
      }
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Email</Text>
      <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" />
      <Text>Mot de passe</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Connexion / Inscription" onPress={handleLoginOrSignUp} />
    </View>
  );
}
