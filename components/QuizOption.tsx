import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@react-navigation/native';

type Props = {
  label: string;
  onPress: () => void;
  isCorrect?: boolean;
  isWrong?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: any;
  isSelected?: boolean;
  showCorrect?: boolean;
};

export default function QuizOption({
  label,
  onPress,
  isCorrect,
  isWrong,
  disabled,
  style,
  textStyle,
  isSelected,
  showCorrect,
}: Props) {
  const { colors, dark } = useTheme();

  let backgroundColor = dark ? '#1f2937' : '#f0f0f0'; // gris foncé ou clair selon thème
  let borderColor = isSelected && !showCorrect ? '#2563eb' : colors.border;
  let textColor = colors.text;

  if (showCorrect) {
    if (isCorrect) {
      backgroundColor = '#22c55e';
      borderColor = '#22c55e';
      textColor = '#fff';
    } else if (isWrong) {
      backgroundColor = '#ef4444';
      borderColor = '#ef4444';
      textColor = '#fff';
    } else {
      backgroundColor = dark ? '#111827' : '#e5e7eb'; // option neutre
      borderColor = colors.border;
      textColor = colors.text;
    }
  }

  return (
    <TouchableOpacity
      style={[styles.option, { backgroundColor, borderColor }, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, { color: textColor }, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 8,
    borderWidth: 2,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});

