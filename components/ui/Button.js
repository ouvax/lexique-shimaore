import { Pressable, Text } from 'react-native';

export function Button({ children, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-blue-500 px-4 py-2 rounded-2xl shadow text-white"
    >
      <Text className="text-white text-center font-semibold">{children}</Text>
    </Pressable>
  );
}
