import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import TextTitle from '../components/TextTitle';
import Section from '../components/Section';
import Card from '../components/Card';

type WordProgress = {
  level: number;
  lastSeen: string;
  reviewCount: number;
};

type ReviewEntry = {
  word: string;
  correct: boolean;
  date: string;
};

export default function StatsScreen() {
  const { colors } = useTheme();
  const [progress, setProgress] = useState<{ [word: string]: WordProgress }>({});
  const [history, setHistory] = useState<ReviewEntry[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const storedProgress = await AsyncStorage.getItem('wordProgress');
      const storedHistory = await AsyncStorage.getItem('reviewHistory');

      if (storedProgress) setProgress(JSON.parse(storedProgress));
      if (storedHistory) setHistory(JSON.parse(storedHistory));
    };

    loadStats();
  }, []);

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <TextTitle>📊 Statistiques</TextTitle>

        <Section title="🧠 Progression des mots">
          {Object.entries(progress).length === 0 ? (
            <Text style={[styles.empty, { color: colors.text }]}>
              Aucun mot encore révisé.
            </Text>
          ) : (
            Object.entries(progress).map(([word, data]) => (
              <Card key={word}>
                <Text style={[styles.word, { color: colors.primary }]}>{word}</Text>
                <Text style={{ color: colors.text }}>Niveau : {data.level}</Text>
                <Text style={{ color: colors.text }}>
                  Dernière révision : {formatDate(data.lastSeen)}
                </Text>
                <Text style={{ color: colors.text }}>
                  Révisions validées : {data.reviewCount}
                </Text>
              </Card>
            ))
          )}
        </Section>

        <Section title="📅 Historique des réponses">
          {history.length === 0 ? (
            <Text style={[styles.empty, { color: colors.text }]}>
              Aucune réponse enregistrée.
            </Text>
          ) : (
            history
              .slice()
              .reverse()
              .map((entry, index) => (
                <Card key={index}>
                  <Text style={{ color: colors.text }}>
                    {entry.correct ? '✅' : '❌'} {entry.word}
                  </Text>
                  <Text style={{ color: colors.text }}>
                    {formatDate(entry.date)}
                  </Text>
                </Card>
              ))
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  word: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  empty: {
    fontStyle: 'italic',
    marginVertical: 8,
  },
});
