import React, { useState, useCallback } from 'react';
import { Text, FlatList, StyleSheet, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import lexique from '../data/lexique.json';
import TextTitle from '../components/TextTitle';
import Card from '../components/Card';

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');
  const [unlockedWords, setUnlockedWords] = useState<string[]>([]);
  const { colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      const loadUnlocked = async () => {
        const data = await AsyncStorage.getItem('wordProgress');
        if (data) {
          const progress = JSON.parse(data);
          const unlocked = Object.keys(progress);
          setUnlockedWords(unlocked);
        }
      };
      loadUnlocked();
    }, [])
  );

  const filteredLexique = lexique
    .filter(item =>
      item.shimaore.toLowerCase().includes(searchText.toLowerCase()) ||
      item.francais.toLowerCase().includes(searchText.toLowerCase())
    )
    .sort((a, b) => {
      const aUnlocked = unlockedWords.includes(a.francais);
      const bUnlocked = unlockedWords.includes(b.francais);
      return aUnlocked === bUnlocked ? 0 : aUnlocked ? -1 : 1;
    });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TextTitle>📘 Lexique Shimaoré</TextTitle>

      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border,
          },
        ]}
        placeholder="🔍 Rechercher un mot..."
        placeholderTextColor={colors.border}
        value={searchText}
        onChangeText={setSearchText}
      />

      <FlatList
        data={filteredLexique}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => {
          const isUnlocked = unlockedWords.includes(item.francais);

          return (
            <Card
              style={{
                borderColor: colors.border,
                backgroundColor: isUnlocked ? colors.card : '#2a2a2a',
              }}
            >
              <Text style={[styles.wordText, { color: isUnlocked ? colors.primary : colors.border }]}>
                🇾🇹 {item.shimaore}
              </Text>
              <Text style={[styles.wordText, { color: isUnlocked ? colors.primary : colors.border }]}>
                🇫🇷 {item.francais}
              </Text>
              {!isUnlocked && (
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={colors.border}
                  style={styles.lockIcon}
                />
              )}
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lockIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});
