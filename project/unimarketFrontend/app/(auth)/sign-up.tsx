import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../../src/contexts/UserContext";
import { DecorativeBackground } from "../../src/components/auth/DecorativeBackground";
import { AuthCard } from "../../src/components/auth/AuthCard";
import { AuthHeader } from "../../src/components/auth/AuthHeader";
import { AuthInput } from "../../src/components/auth/AuthInput";
import { PrimaryButton } from "../../src/components/auth/PrimaryButton";
import { AuthFooterLink } from "../../src/components/auth/AuthFooterLink";

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Missing information", "Please complete all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Password too short", "Use at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Please make sure both passwords match.");
      return;
    }
    if (!agree) {
      Alert.alert("Please confirm", "You need to agree before creating an account.");
      return;
    }

    try {
      setLoading(true);
      await signUp({ name, email, password });
      router.replace("/(tabs)/(market)");
    } catch (error) {
      Alert.alert("Sign up failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(auth)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <DecorativeBackground compact />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 68 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="chevron-back" size={20} color="#2C3B77" />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>

          <AuthCard>
            <AuthHeader
              title="Create Account"
              subtitle="Join UniMarket and start buying and selling on campus."
            />

            <AuthInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
            <AuthInput
              label="School Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@school.edu"
              keyboardType="email-address"
            />
            <AuthInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              secureTextEntry
            />
            <AuthInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter your password"
              secureTextEntry
            />

            <Pressable style={styles.checkboxRow} onPress={() => setAgree((prev) => !prev)}>
              <View style={[styles.checkbox, agree && styles.checkboxChecked]}>
                {agree ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
              </View>
              <Text style={styles.checkboxLabel}>I agree to the terms and student marketplace policy.</Text>
            </Pressable>

            <PrimaryButton title="Sign Up" onPress={handleSignUp} loading={loading} />

            <AuthFooterLink
              prompt="Already have an account?"
              actionLabel="Sign In"
              onPress={() => router.replace("/(auth)/sign-in")}
            />
          </AuthCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF3FF",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "#D9E2FA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    gap: 4,
  },
  backLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2C3B77",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 2,
    marginBottom: 14,
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#C0CBE9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    backgroundColor: "#F8FAFF",
  },
  checkboxChecked: {
    backgroundColor: "#2F54D7",
    borderColor: "#2F54D7",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: "#60667E",
    lineHeight: 17,
  },
});
