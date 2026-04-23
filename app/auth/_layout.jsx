import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="student-signup" />
      <Stack.Screen name="faculty-signup" />
    </Stack>
  );
}
