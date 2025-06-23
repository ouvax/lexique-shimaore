import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useTheme } from '@react-navigation/native';

type Props = ViewProps & {
  children: React.ReactNode;
};

export default function Card({ children, style, ...rest }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
});
