// Profile tab - display logged-in user info
import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useUser } from "../../../src/contexts/UserContext";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { user } = useUser();
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Profile</Text>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || "Guest"}</Text>
          <Text style={styles.userEmail}>{user?.email || ""}</Text>
        </View>

        <View style={styles.divider} />

        {/* Info rows */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#717171" />
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{user?.name || "—"}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color="#717171" />
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || "—"}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About UniMarket</Text>
          <Text style={styles.sectionBody}>
            Buy and sell items within your campus community. Find great deals from fellow students.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#222222",
    letterSpacing: -0.5,
    paddingTop: 16,
    marginBottom: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FF385C",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 15,
    color: "#717171",
  },
  divider: {
    height: 1,
    backgroundColor: "#EBEBEB",
    marginVertical: 20,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 15,
    color: "#717171",
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  separator: {
    height: 1,
    backgroundColor: "#EBEBEB",
    marginLeft: 32,
  },
  infoLabel: {
    fontSize: 15,
    color: "#222222",
    fontWeight: "500",
    width: 60,
  },
  infoValue: {
    fontSize: 15,
    color: "#717171",
    flex: 1,
    textAlign: "right",
  },
});



