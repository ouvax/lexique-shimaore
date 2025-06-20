import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Quiz: { direction: 'FR_TO_SH' | 'SH_TO_FR' };
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'Quiz'>;

export default function HomeQuizScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choisissez le sens du quiz :</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#2563eb' }]}
        onPress={() => navigation.navigate('Quiz', { direction: 'FR_TO_SH' })}
      >
        <Text style={styles.buttonText}>🇫🇷 ➝ 🇾🇹 Français → Shimaoré</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#16a34a' }]}
        onPress={() => navigation.navigate('Quiz', { direction: 'SH_TO_FR' })}
      >
        <Text style={styles.buttonText}>🇾🇹 ➝ 🇫🇷 Shimaoré → Français</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    padding: 16,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
});
