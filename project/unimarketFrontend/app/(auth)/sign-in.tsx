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

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing information", "Enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      await signIn({ email, password });
      router.replace("/(tabs)/(market)");
    } catch (error) {
      Alert.alert("Sign in failed", error instanceof Error ? error.message : "Please try again.");
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
              title="Welcome Back"
              subtitle="Sign in to message sellers, track listings, and keep buying on campus."
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
              placeholder="Enter your password"
              secureTextEntry
            />

            <View style={styles.metaRow}>
              <Pressable style={styles.checkboxRow} onPress={() => setRememberMe((prev) => !prev)}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
                </View>
                <Text style={styles.metaText}>Remember me</Text>
              </Pressable>

              <Pressable onPress={() => Alert.alert("Coming soon", "Forgot password flow can be added next.")}>
                <Text style={styles.linkText}>Forgot password?</Text>
              </Pressable>
            </View>

            <PrimaryButton title="Sign In" onPress={handleSignIn} loading={loading} />

            <AuthFooterLink
              prompt="Don't have an account?"
              actionLabel="Create one"
              onPress={() => router.replace("/(auth)/sign-up")}
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#C0CBE9",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFF",
  },
  checkboxChecked: {
    backgroundColor: "#2F54D7",
    borderColor: "#2F54D7",
  },
  metaText: {
    fontSize: 12,
    color: "#60667E",
    fontWeight: "600",
  },
  linkText: {
    fontSize: 12,
    color: "#2F54D7",
    fontWeight: "700",
  },
});
