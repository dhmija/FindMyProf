import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Link } from "expo-router";

export default function LoginScreen() {
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email format.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password, role);
    } catch (err) {
      setError(err.message || "Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Text style={styles.title}>FindMyProf</Text>
        <Text style={styles.subtitle}>Login to your account</Text>
        
        {error ? <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View> : null}

        <TextInput
          style={styles.input}
          placeholder="College Email"
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          returnKeyType="done"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
        />

        <Text style={styles.roleLabel}>I am a:</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity 
            style={[styles.roleButton, role === "student" && styles.roleActive]}
            onPress={() => setRole("student")}
          >
            <Text style={[styles.roleText, role === "student" && styles.roleActiveText]}>Student</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleButton, role === "faculty" && styles.roleActive]}
            onPress={() => setRole("faculty")}
          >
            <Text style={[styles.roleText, role === "faculty" && styles.roleActiveText]}>Faculty</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Login</Text>}
        </TouchableOpacity>

        <View style={styles.linkContainer}>
          <Link href="/auth/student-signup" asChild>
            <TouchableOpacity style={styles.linkWrapper}><Text style={styles.link}>New Student? Sign up</Text></TouchableOpacity>
          </Link>
          <Link href="/auth/faculty-signup" asChild>
             <TouchableOpacity style={styles.linkWrapper}><Text style={styles.link}>New Faculty? Sign up</Text></TouchableOpacity>
          </Link>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorContainer: {
    padding: 12,
    backgroundColor: '#FFEAEA',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#D8000C',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  roleLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600'
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  roleActive: {
    backgroundColor: '#1E90FF',
    borderColor: '#1E90FF',
  },
  roleText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  roleActiveText: {
    color: '#fff',
  },
  loginBtn: {
    backgroundColor: '#1E90FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  linkWrapper: {
    paddingVertical: 8,
  },
  link: {
    color: '#1E90FF',
    fontSize: 16,
    fontWeight: '600',
  }
});
