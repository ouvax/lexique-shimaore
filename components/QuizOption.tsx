import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';

type Props = {
  label: string;
  onPress: () => void;
  isCorrect?: boolean;
  isWrong?: boolean;
  disabled?: boolean;
};

export default function QuizOption({ label, onPress, isCorrect, isWrong, disabled }: Props) {
  const { colors } = useTheme();

  let backgroundColor = 'transparent';
  let borderColor = colors.primary;
  let textColor = colors.primary;

  if (isCorrect) {
    backgroundColor = '#22c55e'; // vert
    borderColor = '#22c55e';
    textColor = '#fff';
  } else if (isWrong) {
    backgroundColor = '#ef4444'; // rouge
    borderColor = '#ef4444';
    textColor = '#fff';
  }

  return (
    <TouchableOpacity
      style={[
        styles.option,
        { backgroundColor, borderColor }
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  option: {
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
    width: '100%',
  },
  label: {
    fontSize: 18,
    textAlign: 'center',
  },
});
