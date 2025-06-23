import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { useTheme } from '@react-navigation/native';

type Props = TextProps & {
  children: React.ReactNode;
};

export default function TextTitle({ children, style, ...rest }: Props) {
  const { colors } = useTheme();

  return (
    <Text
      style={[styles.title, { color: colors.text }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
});
