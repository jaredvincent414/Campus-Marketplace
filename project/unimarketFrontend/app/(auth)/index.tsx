import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { DecorativeBackground } from "../../src/components/auth/DecorativeBackground";
import { PrimaryButton } from "../../src/components/auth/PrimaryButton";
import { SecondaryButton } from "../../src/components/auth/SecondaryButton";

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <DecorativeBackground />

      <View style={styles.heroWrap}>
        <View style={styles.brandPill}>
          <Ionicons name="storefront" size={15} color="#2F54D7" />
          <Text style={styles.brandPillText}>UniMarket</Text>
        </View>

        <Text style={styles.heroTitle}>Your Campus Marketplace</Text>
        <Text style={styles.heroSubtitle}>
          Buy, sell, and connect with students nearby through a trusted, student-first marketplace.
        </Text>

        <View style={styles.featureRow}>
          <View style={styles.featureChip}>
            <Ionicons name="pricetag-outline" size={13} color="#2F54D7" />
            <Text style={styles.featureChipText}>Find Deals</Text>
          </View>
          <View style={styles.featureChip}>
            <Ionicons name="chatbubble-ellipses-outline" size={13} color="#2F54D7" />
            <Text style={styles.featureChipText}>Message Sellers</Text>
          </View>
          <View style={styles.featureChip}>
            <Ionicons name="school-outline" size={13} color="#2F54D7" />
            <Text style={styles.featureChipText}>Campus Trusted</Text>
          </View>
        </View>
      </View>

      <View style={styles.ctaWrap}>
        <View style={styles.ctaCard}>
          <PrimaryButton
            title="Join UniMarket"
            onPress={() => router.push("/(auth)/sign-up")}
          />
          <View style={styles.ctaSpacing} />
          <SecondaryButton
            title="I Already Have an Account"
            onPress={() => router.push("/(auth)/sign-in")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF0FF",
  },
  heroWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 22,
  },
  brandPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "#D9E2FA",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 16,
    gap: 6,
  },
  brandPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2F54D7",
    letterSpacing: 0.2,
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "900",
    color: "#131B39",
    letterSpacing: -0.8,
    marginBottom: 10,
    maxWidth: 320,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4E5C88",
    maxWidth: 340,
    marginBottom: 18,
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  featureChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#C8D4FA",
    backgroundColor: "rgba(255,255,255,0.8)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  featureChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2F54D7",
  },
  ctaWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  ctaCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#DDE5FA",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: "#0E1F59",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaSpacing: {
    height: 10,
  },
});
