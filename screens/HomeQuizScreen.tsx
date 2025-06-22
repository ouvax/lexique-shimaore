import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'HomeQuiz'>;

export default function HomeQuizScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choisis un sens :</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate('QuizScreen', { direction: 'FR_TO_SH'  as 'FR_TO_SH' })
        }
      >
        <Text style={styles.buttonText}>🇫🇷 → 🇾🇹 Quiz</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate('QuizScreen', { direction: 'SH_TO_FR'  as 'SH_TO_FR'  })
        }
      >
        <Text style={styles.buttonText}>🇾🇹 → 🇫🇷 Quiz</Text>
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
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
});
