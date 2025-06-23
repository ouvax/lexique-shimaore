import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Vibration, Alert, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useRoute, useTheme } from '@react-navigation/native';
import lexique from '../data/lexique.json';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

import PrimaryButton from '../components/PrimaryButton';
import TextTitle from '../components/TextTitle';
import QuizOption from '../components/QuizOption';

type Word = {
  id?: number;
  francais: string;
  shimaore: string;
  frequence: number;
};

type WordProgress = {
  level: number;
  lastSeen: string;
  reviewCount: number;
};

type QuizParams = {
  Quiz: {
    direction: 'FR_TO_SH' | 'SH_TO_FR';
  };
};

type AnswerRecord = {
  word: Word;
  correct: boolean | null;
  selectedOption: Word | null;
};

export default function QuizScreen() {
  const route = useRoute<RouteProp<QuizParams, 'Quiz'>>();
  const direction = route.params.direction;
  const { colors } = useTheme();

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
  const [answerRecords, setAnswerRecords] = useState<AnswerRecord[]>([]); // Pour résumé détaillé
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false); // Afficher mot correct en cas d’erreur
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current; // pour transition fade

  useEffect(() => {
    const initQuiz = async () => {
      await loadProgress();
      await loadWords();
      await loadQuizTimer();
    };
    initQuiz();
  }, []);

  const loadProgress = async () => {
    const stored = await AsyncStorage.getItem('wordProgress');
    if (stored) setProgressData(JSON.parse(stored));
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
        const reviewDelay = Math.pow(2, progress.reviewCount || 0);
        return daysSince >= reviewDelay;
      })
      .sort((a, b) => a.frequence - b.frequence);

    const unique = spaced.filter(
      (word, index, self) =>
        self.findIndex(w => w.francais === word.francais) === index
    );
    const selected = unique.slice(0, 10).map((w, index) => ({ ...w, id: index }));
    setWords(selected);
    if (selected.length === 0) {
      Alert.alert("Aucun mot disponible", "Aucun mot ne remplit les conditions du quiz.");
      return;
    }
    setCurrentWord(selected[0]);
    generateOptions(selected[0], selected);

    const unlockedIds = selected.map(w => w.francais);
    const storedUnlocked = await AsyncStorage.getItem('unlockedWords');
    const alreadyUnlocked: string[] = storedUnlocked ? JSON.parse(storedUnlocked) : [];
    const merged = Array.from(new Set([...alreadyUnlocked, ...unlockedIds]));
    await AsyncStorage.setItem('unlockedWords', JSON.stringify(merged));
  };

  useEffect(() => {
    if (!currentWord) return;
    const logWordSeen = async () => {
      const id = currentWord.francais;
      const newProgress = {
        ...progressData,
        [id]: {
          ...progressData[id],
          lastSeen: new Date().toISOString(),
          reviewCount: progressData[id]?.reviewCount ?? 0,
          level: progressData[id]?.level ?? 1,
        },
      };
      await AsyncStorage.setItem('wordProgress', JSON.stringify(newProgress));
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'users', user.uid), {
          progress: newProgress,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    };
    logWordSeen();
  }, [currentWord]);

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

  const fadeOutIn = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
    });
  };

  const handleAnswer = async (choice: Word | null) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(choice);

    const correct = choice && currentWord && choice.id === currentWord.id;
    if (!currentWord) return;

    if (correct) {
      setScore(score + 1);
      setShowCorrectAnswer(false);
    } else {
      Vibration.vibrate([0, 100, 100, 100]);
      setShowCorrectAnswer(true); // afficher le mot correct
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

    const user = auth.currentUser;
    if (user) {
      await setDoc(doc(db, 'users', user.uid), {
        progress: updatedProgress,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    // Enregistrer la réponse pour résumé
    setAnswerRecords(prev => [...prev, { word: currentWord, correct, selectedOption: choice }]);

    setTimeout(() => {
      fadeOutIn(() => {
        if (questionIndex >= 10) {
          setQuizOver(true);
        } else {
          const nextWord = words[questionIndex];
          setCurrentWord(nextWord);
          generateOptions(nextWord, words);
          setQuestionIndex(prev => prev + 1);
          setSelectedOption(null);
          setShowCorrectAnswer(false);
        }
      });
    }, 700);
  };

  const restartQuiz = () => {
    setScore(0);
    setQuestionIndex(1);
    setQuizOver(false);
    setAnswerRecords([]);
    loadWords();
    setSelectedOption(null);
    setShowCorrectAnswer(false);
  };

  // --- Écran résumé détaillé ---
  if (quizOver) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, padding: 20 }]}>
        <TextTitle>🎉 Quiz terminé !</TextTitle>
        <Text style={[styles.score, { color: score >= 6 ? '#22c55e' : '#ef4444' }]}>
          Score : {score} / 10
        </Text>
        <View style={{ marginVertical: 15, flex: 1 }}>
          <TextTitle style={{ fontSize: 18, marginBottom: 10 }}>Résumé détaillé :</TextTitle>
          {answerRecords.map(({ word, correct, selectedOption }, i) => (
            <View key={i} style={[styles.answerRow, { borderColor: correct ? '#22c55e' : '#ef4444' }]}>
              <Text style={{ flex: 1 }}>
                {direction === 'FR_TO_SH' ? word.francais : word.shimaore} →{' '}
                {direction === 'FR_TO_SH' ? word.shimaore : word.francais}
              </Text>
              <Text style={{ color: correct ? '#22c55e' : '#ef4444' }}>
                {correct ? 'Correct' : `Faux (rép: ${
                  selectedOption
                    ? direction === 'FR_TO_SH' ? selectedOption.shimaore : selectedOption.francais
                    : 'Aucune réponse'
                })`}
              </Text>
            </View>
          ))}
        </View>
        <PrimaryButton title="Recommencer" onPress={restartQuiz} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextTitle>
        Question {questionIndex} / 10
      </TextTitle>
      <Text style={[styles.timer, { color: colors.text }]}>Temps restant : {timeLeft}s</Text>
      <Animated.View style={{ opacity: fadeAnim, flex: 1, justifyContent: 'center' }}>
        <Text style={[styles.questionText, { color: colors.text }]}>
          {direction === 'FR_TO_SH' ? currentWord?.francais : currentWord?.shimaore}
        </Text>
        {options.map((opt) => {
          const isSelected = selectedOption?.id === opt.id;
          const correctOption = currentWord?.id === opt.id;
          const isCorrectAnswer = selectedOption && correctOption && isSelected;
          const isWrongAnswer = selectedOption && !correctOption && isSelected;
          return (
            <QuizOption
              key={opt.id}
              label={direction === 'FR_TO_SH' ? opt.shimaore : opt.francais}
              onPress={() => !selectedOption && handleAnswer(opt)}
              disabled={!!selectedOption}
              style={[
                isCorrectAnswer && { backgroundColor: '#22c55e' },
                isWrongAnswer && { backgroundColor: '#ef4444' },
              ]}
            />
          );
        })}
        {showCorrectAnswer && (
          <Text style={[styles.correctAnswer, { color: '#22c55e' }]}>
            Réponse correcte : {direction === 'FR_TO_SH' ? currentWord?.shimaore : currentWord?.francais}
          </Text>
        )}
      </Animated.View>
      <Text style={[styles.score, { color: colors.text }]}>Score : {score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  questionText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 20,
    textAlign: 'center',
  },
  timer: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  score: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    padding: 10,
    marginBottom: 5,
    borderRadius: 5,
  },
  correctAnswer: {
    fontSize: 16,
    marginTop: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
