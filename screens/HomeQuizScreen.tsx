import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useTheme } from '@react-navigation/native';

// 🔽 Kit UI
import PrimaryButton from '../components/PrimaryButton';
import TextTitle from '../components/TextTitle';

type NavigationProp = StackNavigationProp<RootStackParamList, 'HomeQuiz'>;

export default function HomeQuizScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextTitle>Choisis un sens</TextTitle>

      <PrimaryButton
        title="🇫🇷 → 🇾🇹 Quiz"
        onPress={() => navigation.navigate('QuizScreen', { direction: 'FR_TO_SH' })}
      />
      <PrimaryButton
        title="🇾🇹 → 🇫🇷 Quiz"
        onPress={() => navigation.navigate('QuizScreen', { direction: 'SH_TO_FR' })}
      />
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
});
