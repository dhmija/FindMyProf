import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function DirectoryDetail() {
  const { id } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Directory Detail for: {id}</Text>
    </View>
  );
}
