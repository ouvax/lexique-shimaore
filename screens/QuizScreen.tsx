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

  // --- FONCTION GLOBALE de MAJ mots débloqués et progression Firestore/LocalStorage ---
  const updateUnlockedWordsAndProgress = async (
    newProgress: { [id: string]: WordProgress },
    newUnlockedWords: string[]
  ) => {
    // Mise à jour local storage unlockedWords
    const storedUnlocked = await AsyncStorage.getItem('unlockedWords');
    const alreadyUnlocked: string[] = storedUnlocked ? JSON.parse(storedUnlocked) : [];
    const mergedUnlocked = Array.from(new Set([...alreadyUnlocked, ...newUnlockedWords]));
    await AsyncStorage.setItem('unlockedWords', JSON.stringify(mergedUnlocked));

    // Mise à jour Firestore
    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            progress: newProgress,
            unlockedWords: mergedUnlocked,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (e) {
        console.error('Erreur sauvegarde Firestore:', e);
      }
    }
  };

  // --- INIT quiz : load progress, words, timer ---
  useEffect(() => {
    const initQuiz = async () => {
      const progress = await loadProgress();
      await loadWords(progress);
      await loadQuizTimer();
    };
    initQuiz();
  }, []);

  // Reset timeLeft à chaque question ou changement de timer
  useEffect(() => {
    setTimeLeft(timer);
  }, [questionIndex, timer]);

  // Charge progression sauvegardée (local storage)
  const loadProgress = async (): Promise<{ [id: string]: WordProgress }> => {
    try {
      const stored = await AsyncStorage.getItem('wordProgress');
      if (stored) {
        const parsed = JSON.parse(stored);
        setProgressData(parsed);
        return parsed;
      }
    } catch (e) {
      console.error('Erreur chargement progression:', e);
    }
    return {};
  };

  // Charge mots filtrés pour quiz selon spaced repetition + fréquence + niveau
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

    // Uniques par francais (évite doublons)
    const unique = spaced.filter(
      (word, index, self) =>
        self.findIndex(w => w.francais === word.francais) === index
    );

    // Sélectionne 10 premiers mots selon fréquence & niveau
    const selected = unique.slice(0, 10).map((w, index) => ({ ...w, id: index }));
    if (selected.length === 0) {
      Alert.alert("Aucun mot disponible", "Aucun mot ne remplit les conditions du quiz.");
      return;
    }
    setWords(selected);
    setCurrentWord(selected[0]);
    generateOptions(selected[0], selected);

    // Mise à jour mots débloqués + progress Firestore/localstorage
    const unlockedIds = selected.map(w => w.francais);
    await updateUnlockedWordsAndProgress(progressData, unlockedIds);
  };

  // Sauvegarde date dernière consultation du mot quand currentWord change
  useEffect(() => {
    if (!currentWord) return;
    const logWordSeen = async () => {
      const id = currentWord.francais;
      const old = progressData[id] || { level: 0, lastSeen: '', reviewCount: 0 };
      const newProgress = {
        ...progressData,
        [id]: {
          ...old,
          lastSeen: new Date().toISOString(),
          reviewCount: old.reviewCount,
          level: old.level,
        },
      };
      setProgressData(newProgress);
      await AsyncStorage.setItem('wordProgress', JSON.stringify(newProgress));

      // Met à jour Firestore aussi (utile pour cohérence)
      await updateUnlockedWordsAndProgress(newProgress, Object.keys(newProgress));
    };
    logWordSeen();
  }, [currentWord]);

  // Charge durée timer quiz depuis préférences
  const loadQuizTimer = async () => {
    const saved = await AsyncStorage.getItem('quizTimer');
    const parsed = saved ? parseInt(saved) : 10;
    setTimer(parsed);
    setTimeLeft(parsed);
  };

  // Génère 3 mauvaises réponses + 1 bonne, shuffle l'ensemble
  const generateOptions = (word: Word, list: Word[]) => {
    const incorrect = list.filter(w => w.id !== word.id);
    const shuffled = incorrect.sort(() => 0.5 - Math.random()).slice(0, 3);
    const allOptions = [...shuffled, word].sort(() => 0.5 - Math.random());
    setOptions(allOptions);
  };

  // Lance compte à rebours
  const startCountdown = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(timer);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAnswer(null); // Temps écoulé = réponse nulle
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Relance chrono à chaque question
  useEffect(() => {
    if (currentWord) startCountdown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentWord]);

  // Animation fade out puis in pour transition question
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

  // Gestion réponse utilisateur
  const handleAnswer = async (selected: Word | null) => {
    if (!currentWord) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const correct = selected?.francais === currentWord.francais;

    // Vibration
    if (correct) {
      Vibration.vibrate(100);
      setScore(score + 1);
    } else {
      Vibration.vibrate([0, 300]);
    }

    // Mise à jour progression
    const oldProg = progressData[currentWord.francais] || {
      level: 0,
      lastSeen: '',
      reviewCount: 0,
    };
    const newLevel = correct
      ? Math.min(oldProg.level + 1, 5)
      : Math.max(oldProg.level - 1, 0);
    const newReviewCount = oldProg.reviewCount + 1;
    const newProgress = {
      ...progressData,
      [currentWord.francais]: {
        level: newLevel,
        lastSeen: new Date().toISOString(),
        reviewCount: newReviewCount,
      },
    };
    setProgressData(newProgress);
    await AsyncStorage.setItem('wordProgress', JSON.stringify(newProgress));

    // Met à jour Firestore + unlocked words
    const unlockedIds = words.map(w => w.francais);
    await updateUnlockedWordsAndProgress(newProgress, unlockedIds);

    // Enregistre résultat réponse
    setAnswerRecords((prev) => [
      ...prev,
      { word: currentWord, correct, selectedOption: selected },
    ]);
    setShowCorrectAnswer(true);
    setSelectedOption(selected);

    // Passage à la question suivante après delay
    setTimeout(() => {
      setShowCorrectAnswer(false);
      setSelectedOption(null);

      if (questionIndex >= 10) {
        setQuizOver(true);
        setCurrentWord(null);
      } else {
        const nextIndex = questionIndex;
        setQuestionIndex(nextIndex + 1);
        const nextWord = words[nextIndex];
        setCurrentWord(nextWord);
        generateOptions(nextWord, words);
      }
    }, 1500);
  };

  if (!currentWord) {
    if (quizOver) {
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <TextTitle>Quiz terminé</TextTitle>
          <Text style={{ color: colors.text, fontSize: 18 }}>
            Score : {score} / 10
          </Text>
          {/* Ajoute ici bouton retour, restart, etc. */}
        </View>
      );
    }
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.progressText, { color: colors.text }]}>
        Question {questionIndex} / 10
      </Text>
      <Text style={[styles.timerText, { color: colors.text }]}>
        Temps restant : {timeLeft}s
      </Text>
      <Animated.View style={{ opacity: fadeAnim, flex: 1, justifyContent: 'center' }}>
        <TextTitle>
          {direction === 'FR_TO_SH' ? currentWord.francais : currentWord.shimaore}
        </TextTitle>
        {options.map((opt) => (
          <QuizOption
            key={opt.francais}
            label={direction === 'FR_TO_SH' ? opt.shimaore : opt.francais}
            disabled={showCorrectAnswer}
            isCorrect={opt.francais === currentWord.francais}
            isSelected={selectedOption?.francais === opt.francais}
            onPress={() => !showCorrectAnswer && handleAnswer(opt)}
          />
        ))}
        {showCorrectAnswer && (
          <Text style={{ color: colors.text, marginTop: 10 }}>
            {selectedOption?.francais === currentWord.francais
              ? 'Bonne réponse !'
              : `Mauvaise réponse. La bonne réponse est : ${
                  direction === 'FR_TO_SH' ? currentWord.shimaore : currentWord.francais
                }`}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  progressText: {
    fontSize: 16,
    marginBottom: 10,
  },
  timerText: {
    fontSize: 16,
    marginBottom: 20,
  },
});
