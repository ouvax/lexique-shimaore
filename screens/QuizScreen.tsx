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
  const [answerRecords, setAnswerRecords] = useState<AnswerRecord[]>([]);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const initQuiz = async () => {
      const progress = await loadProgress();
      await loadWords(progress);
      await loadQuizTimer();
    };
    initQuiz();
  }, []);

  useEffect(() => {
    setTimeLeft(timer);
  }, [questionIndex, timer]);

  const loadProgress = async (): Promise<{ [id: string]: WordProgress }> => {
    const stored = await AsyncStorage.getItem('wordProgress');
    if (stored) {
      const parsed = JSON.parse(stored);
      setProgressData(parsed);
      return parsed;
    }
    return {};
  };

  const loadWords = async (progress: { [id: string]: WordProgress }) => {
    const now = new Date();
    const spaced = lexique
      .filter(w => w.francais && w.shimaore)
      .filter(w => {
        const prog = progress[w.francais];
        if (!prog) return true;
        const last = new Date(prog.lastSeen);
        const daysSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
        const reviewDelay = Math.pow(2, prog.reviewCount || 0);
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
      setProgressData(newProgress);
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

  // Correction fadeOutIn: appeler callback entre fadeOut et fadeIn pour éviter flash
  const fadeOutIn = (callback: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
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
      setShowCorrectAnswer(true);
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
    loadWords(progressData);
  };

  if (!currentWord) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingHorizontal: 30 }]}>
      <Text style={[styles.progress, { color: colors.text }]}>Question {questionIndex} / 10</Text>

      {/* Barre de progression visuelle */}
      <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
        <View style={[styles.progressBarFill, { width: `${(questionIndex / 10) * 100}%`, backgroundColor: colors.primary }]} />
      </View>

      <Text style={[styles.timer, { color: colors.text }]}>Temps restant : {timeLeft}s</Text>

      <Animated.View style={{ opacity: fadeAnim, flex: 1, justifyContent: 'center' }}>
        <TextTitle style={{ color: colors.text, marginBottom: 20 }}>
          {direction === 'FR_TO_SH' ? currentWord.francais : currentWord.shimaore}
        </TextTitle>

        {options.map(option => (
          <QuizOption
            key={option.id}
            label={direction === 'FR_TO_SH' ? option.shimaore : option.francais}
            onPress={() => handleAnswer(option)}
            disabled={!!selectedOption}
            isCorrect={option.id === currentWord.id}
            isSelected={selectedOption?.id === option.id}
            showCorrect={showCorrectAnswer}
          />
        ))}
      </Animated.View>

      {quizOver && (
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: colors.text, marginBottom: 10 }}>
            Quiz terminé ! Score : {score} / 10
          </Text>
          <PrimaryButton onPress={restartQuiz} title="Recommencer" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  progress: {
    fontSize: 18,
    marginBottom: 5,
    alignSelf: 'center',
  },
  timer: {
    fontSize: 18,
    marginBottom: 15,
    alignSelf: 'center',
  },
  progressBarContainer: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 15,
    marginHorizontal: 30,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
});
