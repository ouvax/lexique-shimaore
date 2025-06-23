import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import PrimaryButton from '../components/PrimaryButton';
import TextTitle from '../components/TextTitle';
import { auth, db } from '../firebase';  // Assure-toi que 'db' est importé depuis ta config firebase
import { getDoc, doc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importer ton type RootStackParamList
import type { RootStackParamList } from '../types'; // Modifie ce chemin selon ta structure

export default function LoginScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Erreur', 'Email et mot de passe sont requis');
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert('✅ Inscription réussie !', 'Tu peux maintenant te connecter.');
        setIsRegistering(false);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Charger données Firestore utilisateur après connexion
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();

          if (data.progress) {
            await AsyncStorage.setItem('wordProgress', JSON.stringify(data.progress));
          }
          if (data.settings) {
            await AsyncStorage.setItem('quizTimer', data.settings.quizTimer.toString());
          }
          if (data.unlockedWords) {
            await AsyncStorage.setItem('unlockedWords', JSON.stringify(data.unlockedWords));
          }
        }

        Alert.alert('✅ Connexion réussie !');
        navigation.replace('Home');  // Utilise "Home" (pas HomeScreen)
      }
    } catch (error: any) {
      console.error('Firebase auth error:', error);
      let message = 'Une erreur est survenue';
      if (error.code === 'auth/user-not-found') {
        message = "Utilisateur non trouvé. Veuillez vérifier l'email.";
      } else if (error.code === 'auth/wrong-password') {
        message = 'Mot de passe incorrect.';
      } else if (error.code === 'auth/invalid-email') {
        message = "Format d'email invalide.";
      } else if (error.code === 'auth/email-already-in-use') {
        message = "Cet email est déjà utilisé.";
      }
      Alert.alert('Erreur', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TextTitle>{isRegistering ? '📝 Inscription' : '🔐 Connexion'}</TextTitle>

      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="Email"
        placeholderTextColor={colors.border}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />

      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        placeholder="Mot de passe"
        placeholderTextColor={colors.border}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <PrimaryButton
        title={isRegistering ? "S'inscrire" : 'Se connecter'}
        onPress={handleSubmit}
        disabled={loading}
        loading={loading}
      />

      <TouchableOpacity disabled={loading} onPress={() => setIsRegistering(!isRegistering)}>
        <Text style={[styles.toggleText, { color: colors.primary }]}>
          {isRegistering
            ? '← Tu as déjà un compte ? Se connecter'
            : "Pas encore de compte ? S'inscrire"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  toggleText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
  },
});
