import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeQuizScreen from '../screens/HomeQuizScreen';
import QuizScreen from '../screens/QuizScreen';

const Stack = createStackNavigator();

export default function QuizStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeQuiz" component={HomeQuizScreen} options={{ title: 'Quiz' }} />
      <Stack.Screen name="QuizScreen" component={QuizScreen} options={{ title: 'Question' }} />
    </Stack.Navigator>
  );
}

