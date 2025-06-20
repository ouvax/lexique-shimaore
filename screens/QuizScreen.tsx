import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useRoute } from '@react-navigation/native';
import lexique from '../data/lexique.json';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const saveQuizProgress = async (userData: any) => {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(doc(db, 'users', user.uid), {
    progress: userData,         // données sur les mots, niveaux, dates, etc.
    updatedAt: new Date().toISOString(),
  }, { merge: true }); // ✅ merge pour conserver les données existantes
};

interface Word {
  id: number;
  francais: string;
  shimaore: string;
  frequence: number;
  categorie: string;
}

interface WordProgress {
  level: number;
  lastSeen: string;
  reviewCount?: number;
}

type QuizParams = {
  Quiz: {
    direction: 'FR_TO_SH' | 'SH_TO_FR';
  };
};

export default function QuizScreen() {
  const route = useRoute<RouteProp<QuizParams, 'Quiz'>>();
  const direction = route.params.direction;

  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [questionIndex, setQuestionIndex] = useState(1);
  const [score, setScore] = useState(0);
  const [quizOver, setQuizOver] = useState(false);
  const [timer, setTimer] = useState(10);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedOption, setSelectedOption] = useState<Word | null>(null);
  const [progressData, setProgressData] = useState<{ [id: string]: WordProgress }>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadWords();
    loadQuizTimer();
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const stored = await AsyncStorage.getItem('wordProgress');
    if (stored) {
      setProgressData(JSON.parse(stored));
    }
  };

  const loadWords = async () => {
    const now = new Date();

    const spaced = lexique
      .filter(w => w.francais && w.shimaore)
      .filter(w => {
        const progress = progressData[w.francais];
        if (!progress) return true;
        if (progress.level < 5) return true;

        const last = new Date(progress.lastSeen);
        const daysSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
        const reviewDelay = Math.pow(2, progress.reviewCount || 0); // 2, 4, 8, 16...

        return daysSince >= reviewDelay;
      })
      .sort((a, b) => a.frequence - b.frequence);

    const unique = spaced.filter(
      (word, index, self) =>
        self.findIndex(w => w.francais === word.francais) === index
    );

    const selected = unique.slice(0, 10).map((w, index) => ({ ...w, id: index }));
    setWords(selected);
    setCurrentWord(selected[0]);
    generateOptions(selected[0], selected);

    // ✅ Déverrouiller les mots du quiz
    const unlockedIds = selected.map(w => w.francais);
    const storedUnlocked = await AsyncStorage.getItem('unlockedWords');
    const alreadyUnlocked: string[] = storedUnlocked ? JSON.parse(storedUnlocked) : [];
    const merged = Array.from(new Set([...alreadyUnlocked, ...unlockedIds]));
    await AsyncStorage.setItem('unlockedWords', JSON.stringify(merged));
  };

  const loadQuizTimer = async () => {
    const saved = await AsyncStorage.getItem('quizTimer');
    const parsed = saved ? parseInt(saved) : 10;
    setTimer(parsed);
    setTimeLeft(parsed);
  };

  const generateOptions = (word: Word, list: Word[]) => {
    const incorrect = list.filter(w => w.id !== word.id);
    const shuffled = incorrect.sort(() => 0.5 - Math.random()).slice(0, 3);
    const allOptions = [...shuffled, word].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
  };

  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(timer);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAnswer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (currentWord) startCountdown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentWord]);

  const handleAnswer = async (choice: Word | null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(choice);

    const correct = choice && currentWord && choice.id === currentWord.id;
    if (!currentWord) return;

    if (correct) {
      setScore(score + 1);
    } else {
      Vibration.vibrate([0, 100, 100, 100]);
    }

    const id = currentWord.francais;
    const old = progressData[id] || { level: 0, lastSeen: '', reviewCount: 0 };
    let newLevel = old.level;
    let newReviewCount = old.reviewCount || 0;

    if (correct) {
      if (newLevel < 5) newLevel++;
      if (newLevel === 5) newReviewCount++;
    } else {
      if (newLevel === 5) newLevel = 4;
      newReviewCount = 0;
    }

    const updatedProgress = {
      ...progressData,
      [id]: {
        level: newLevel,
        lastSeen: new Date().toISOString(),
        reviewCount: newReviewCount,
      },
    };

    setProgressData(updatedProgress);
    await AsyncStorage.setItem('wordProgress', JSON.stringify(updatedProgress));

    setTimeout(() => {
      if (questionIndex >= 10) {
        setQuizOver(true);
      } else {
        const nextWord = words[questionIndex];
        setCurrentWord(nextWord);
        generateOptions(nextWord, words);
        setQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
      }
    }, 700);
  };

  const restartQuiz = () => {
    setScore(0);
    setQuestionIndex(1);
    setQuizOver(false);
    loadWords();
    setSelectedOption(null);
  };

  if (!currentWord) return null;

  return (
    <View style={styles.container}>
      {quizOver ? (
        <View style={styles.centered}>
          <Text style={styles.title}>🎉 Quiz terminé !</Text>
          <Text style={[styles.score, { color: score >= 6 ? '#16a34a' : '#dc2626' }]}>Score : {score} / 10</Text>
          <TouchableOpacity style={styles.button} onPress={restartQuiz}>
            <Text style={styles.buttonText}>Recommencer 🔁</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.centered}>
          <Text style={styles.progress}>Question {questionIndex}/10</Text>
          <Text style={styles.timer}>⏳ Temps restant : {timeLeft}s</Text>
          <Text style={styles.question}>
            {direction === 'FR_TO_SH' ? `🇫🇷 ${currentWord.francais}` : `🇾🇹 ${currentWord.shimaore}`}
          </Text>

          {options.map(option => {
            const label = direction === 'FR_TO_SH' ? option.shimaore : option.francais;
            let styleOption = styles.option;
            if (selectedOption) {
              if (option.id === currentWord.id) styleOption = styles.optionCorrect;
              else if (option.id === selectedOption.id) styleOption = styles.optionIncorrect;
            }
            return (
              <TouchableOpacity
                key={option.id}
                style={styleOption}
                onPress={() => handleAnswer(option)}
                disabled={!!selectedOption}
              >
                <Text style={styles.optionText}>
                  {direction === 'FR_TO_SH' ? `🇾🇹 ${label}` : `🇫🇷 ${label}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  centered: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  score: { fontSize: 20, marginBottom: 20 },
  progress: { fontSize: 18, marginBottom: 10 },
  timer: { fontSize: 18, color: '#dc2626', marginBottom: 10 },
  question: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  option: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    width: '100%',
  },
  optionCorrect: {
    backgroundColor: '#bbf7d0',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    width: '100%',
  },
  optionIncorrect: {
    backgroundColor: '#fecaca',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    width: '100%',
  },
  optionText: { fontSize: 18, textAlign: 'center' },
  button: {
    marginTop: 20,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: { color: 'white', fontSize: 16 },
});
