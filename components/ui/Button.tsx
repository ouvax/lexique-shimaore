// components/ui/Button.tsx

import { Pressable, Text } from 'react-native';

type ButtonProps = {
  children: React.ReactNode;
  onPress: () => void;
};

export function Button({ children, onPress }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#3B82F6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        marginTop: 20,
      }}
    >
      <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
        {children}
      </Text>
    </Pressable>
  );
}
