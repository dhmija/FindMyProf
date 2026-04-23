import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { UserProvider } from "../context/UserContext";

export default function Layout() {
  return (
    <AuthProvider>
      <UserProvider>
        <Stack />
      </UserProvider>
    </AuthProvider>
  );
}
