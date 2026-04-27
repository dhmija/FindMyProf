import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Link, useLocalSearchParams, useRouter } from "expo-router";

export default function LoginScreen() {
  const { login } = useAuth();
  const { returnTo } = useLocalSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError("Please enter a valid email."); return; }

    setLoading(true);
    try {
      await login(email, password, role);
      if (returnTo) { router.replace(returnTo); } else { router.replace(`/${role}/home`); }
    } catch (err) {
      setError(err.message || "Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <Animated.ScrollView 
        style={{ flex: 1, backgroundColor: '#fff', opacity: fadeAnim }} 
        contentContainerStyle={[styles.container, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>FindMyProf</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="College email"
          placeholderTextColor="#bbb"
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#bbb"
          secureTextEntry
          returnKeyType="done"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
        />

        <Text style={styles.roleLabel}>I am a:</Text>
        <View style={styles.roleRow}>
          {["student", "faculty"].map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.rolePill, role === r && styles.rolePillActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.rolePillText, role === r && styles.rolePillTextActive]}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Login</Text>}
        </TouchableOpacity>

        <View style={styles.links}>
          <Link href="/auth/student-signup" asChild>
            <TouchableOpacity><Text style={styles.link}>New student? Sign up</Text></TouchableOpacity>
          </Link>
          <Link href="/auth/faculty-signup" asChild>
            <TouchableOpacity><Text style={styles.link}>New faculty? Sign up</Text></TouchableOpacity>
          </Link>
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 32,
  },
  error: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 4,
    padding: 10,
  },
  input: {
    fontSize: 15,
    color: '#111',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  roleLabel: {
    fontSize: 12,
    color: '#aaa',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  rolePill: {
    flex: 1,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#d5d5d5',
    borderRadius: 6,
    alignItems: 'center',
  },
  rolePillActive: {
    backgroundColor: '#111',
    borderColor: '#111',
  },
  rolePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  rolePillTextActive: {
    color: '#fff',
  },
  btn: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: '#ccc',
  },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  links: {
    marginTop: 28,
    alignItems: 'center',
    gap: 10,
  },
  link: {
    fontSize: 14,
    color: '#888',
  },
});
