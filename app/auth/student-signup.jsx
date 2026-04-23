import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, ScrollView } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { signUp } from "../../services/authService";
import { setDoc, doc } from "firebase/firestore";
import { firestore } from "../../services/firebase";
import { Link } from "expo-router";

export default function StudentSignupScreen() {
  const { setSessionRole } = useAuth();
  
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
      
      // 3. Persist Role & triggers root layout automatically routing to home
      await setSessionRole("student");
      
    } catch (err) {
      setError(err.message || "An error occurred during registration.");
      setLoading(false);
    }
  };

  return (
    <Animated.ScrollView style={{ flex: 1, backgroundColor: '#F5F5F5', opacity: fadeAnim }} contentContainerStyle={styles.container}>
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
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Register</Text>}
      </TouchableOpacity>
      
      <View style={styles.linkContainer}>
        <Link href="/auth/login" asChild>
          <TouchableOpacity style={styles.linkWrapper}><Text style={styles.link}>Already have an account? Login</Text></TouchableOpacity>
        </Link>
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
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
  btn: {
    backgroundColor: '#1E90FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
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
