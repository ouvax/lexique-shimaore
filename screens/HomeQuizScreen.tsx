import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TextTitle from '../components/TextTitle';
import PrimaryButton from '../components/PrimaryButton';

export default function HomeQuizScreen({ navigation }: any) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TextTitle>🧠 Quiz Shimaoré</TextTitle>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Teste tes connaissances des mots appris !
      </Text>

      <View style={styles.buttons}>
        <PrimaryButton
          title="Shimaoré → Français"
          onPress={() => navigation.navigate('QuizScreen', { mode: 'SH_TO_FR' })}
        />
        <PrimaryButton
          title="Français → Shimaoré"
          onPress={() => navigation.navigate('QuizScreen', { mode: 'FR_TO_SH' })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 12,
  },
  buttons: {
    gap: 12,
    marginTop: 20,
  },
});
