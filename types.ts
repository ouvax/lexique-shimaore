
export type Word = {
  id?: number;
  francais: string;
  shimaore: string;
  frequence: number;
};

export type WordProgress = {
  level: number;
  lastSeen: string;
  reviewCount: number;
};

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Lexique: undefined;
  Quiz: undefined;
  Settings: undefined;
  Stats: undefined;
  HomeQuiz: undefined;
  AuthLoading: undefined;
  QuizScreen: { direction: 'FR_TO_SH' | 'SH_TO_FR' };
};
