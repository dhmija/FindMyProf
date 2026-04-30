import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { signUp } from "../../services/authService";
import { setDoc, doc } from "firebase/firestore";
import { firestore } from "../../services/firebase";
import { Link, useRouter } from "expo-router";

export default function StudentSignupScreen() {
  const { setSessionRole } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  
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

  const handleSignup = async () => {
    setError("");
    
    // Validation
    if (!fullName || !email || !password || !confirmPassword || !department || !semester) {
      setError("Please fill in all fields.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email format.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const semNum = parseInt(semester);
    if (isNaN(semNum) || semNum < 1 || semNum > 8) {
      setError("Semester must be a valid number between 1 and 8.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create Auth User
      const user = await signUp(email, password);
      
      // 2. Create Firestore Document
      await setDoc(doc(firestore, "students", user.uid), {
        fullName,
        email,
        department,
        semester: semNum,
        createdAt: new Date().toISOString()
      });
      
      // 3. Persist role then navigate to directory
      await setSessionRole("student");
      router.replace("/(tabs)/directory");

    } catch (err) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.ScrollView 
        style={{ flex: 1, backgroundColor: colors.background, opacity: fadeAnim }} 
        contentContainerStyle={[styles.container, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.title}>Student Signup</Text>
      <Text style={styles.subtitle}>Create your FindMyProf account</Text>
      
      {error ? <View style={styles.errorContainer}><Text style={styles.errorText}>{error}</Text></View> : null}

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        autoCapitalize="words"
        returnKeyType="next"
        value={fullName}
        onChangeText={setFullName}
      />

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
        placeholder="Department (e.g. Computer Science)"
        returnKeyType="next"
        value={department}
        onChangeText={setDepartment}
      />

      <TextInput
        style={styles.input}
        placeholder="Semester (1-8)"
        keyboardType="number-pad"
        returnKeyType="next"
        value={semester}
        onChangeText={setSemester}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        returnKeyType="next"
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        returnKeyType="done"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        onSubmitEditing={handleSignup}
      />

      <TouchableOpacity style={styles.btn} onPress={handleSignup} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.btnText}>Register</Text>}
      </TouchableOpacity>
      
      <View style={styles.linkContainer}>
        <Link href="/auth/login" asChild>
          <TouchableOpacity style={styles.linkWrapper}><Text style={styles.link}>Already have an account? Login</Text></TouchableOpacity>
        </Link>
      </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 60,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textVeryMuted,
    textAlign: 'center',
    marginBottom: 28,
  },
  errorContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  input: {
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: colors.inputBg,
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
  linkContainer: {
    marginTop: 28,
    alignItems: 'center',
  },
  linkWrapper: {
    paddingVertical: 6,
  },
  link: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
