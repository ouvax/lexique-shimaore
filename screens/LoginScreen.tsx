import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

import PrimaryButton from '../components/PrimaryButton';
import TextTitle from '../components/TextTitle';
import { auth } from '../firebase';

export default function LoginScreen() {
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    console.log('handleSubmit called', { email, password, isRegistering });

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
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert('✅ Connexion réussie !');
      }
    } catch (error: any) {
      console.error('Firebase auth error:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
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
