import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import lexique from '../data/lexique.json';

import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');
  const [unlockedWords, setUnlockedWords] = useState<string[]>([]);

  // ✅ Test Firestore dès que l'écran est monté
  useEffect(() => {
    const testWriteToFirestore = async () => {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          test: true,
          timestamp: new Date().toISOString(),
        }, { merge: true });
        console.log('✅ Donnée test écrite dans Firestore');
      } else {
        console.log('❌ Aucun utilisateur connecté');
      }
    };

    testWriteToFirestore();
  }, []);

  // 🔁 Chargement des mots déverrouillés
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
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Rechercher un mot..."
        value={searchText}
        onChangeText={setSearchText}
      />

      <FlatList
        data={filteredLexique}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => {
          const isUnlocked = unlockedWords.includes(item.francais);
          const itemStyle = isUnlocked ? styles.itemUnlocked : styles.itemLocked;
          const textStyle = isUnlocked ? styles.wordText : styles.wordTextLocked;

          return (
            <View style={itemStyle}>
              <Text style={textStyle}>🇾🇹 {item.shimaore}</Text>
              <Text style={textStyle}>🇫🇷 {item.francais}</Text>
              {!isUnlocked && (
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color="#555"
                  style={styles.lockIcon}
                />
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  itemUnlocked: {
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
  },
  itemLocked: {
    alignItems: 'center',
    backgroundColor: '#eee',
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    position: 'relative',
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
  },
  wordTextLocked: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    textAlign: 'center',
  },
  lockIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});
