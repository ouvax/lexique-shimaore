import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '@react-navigation/native';

type Props = ViewProps & {
  title?: string;
  children: React.ReactNode;
};

export default function Section({ title, children, style, ...rest }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.section, style]} {...rest}>
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: 16,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
});
