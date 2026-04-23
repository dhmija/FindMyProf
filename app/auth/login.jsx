import { View, Text, Button } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Login Screen</Text>
      <Button title="Mock Login Student" onPress={() => login("test@example.com", "password", "student")} />
      <Button title="Mock Login Faculty" onPress={() => login("test@example.com", "password", "faculty")} />
    </View>
  );
}
