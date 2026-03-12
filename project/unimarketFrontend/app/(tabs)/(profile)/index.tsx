// Profile tab - redesigned profile hub
import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useUser } from "../../../src/contexts/UserContext";
import { useListings } from "../../../src/contexts/ListingsContext";
import { Ionicons } from "@expo/vector-icons";
import { appColors } from "../../../src/theme/colors";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useUser();
  const { userListings, loadUserListings, isLoading } = useListings();

  useEffect(() => {
    if (user?.email) {
      loadUserListings(user.email);
    }
  }, [user?.email]);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const isVerifiedStudent = Boolean(user?.email?.toLowerCase().endsWith(".edu"));

  const stats = useMemo(
    () => [
      { label: "Listings", value: isLoading ? "..." : String(userListings.length) },
      { label: "Saved", value: "0" },
      { label: "Purchases", value: "0" },
      { label: "Rating", value: "New" },
    ],
    [isLoading, userListings.length]
  );

  const quickActions = [
    {
      key: "listings",
      label: "My Listings",
      subtitle: "Manage your items",
      icon: "pricetag-outline",
      onPress: () => router.push("/(tabs)/(my-listings)"),
    },
    {
      key: "saved",
      label: "Saved Items",
      subtitle: "View favorites",
      icon: "bookmark-outline",
      onPress: () => Alert.alert("Coming soon", "Saved Items is coming soon."),
    },
    {
      key: "messages",
      label: "Messages",
      subtitle: "Buyer chats",
      icon: "chatbubble-ellipses-outline",
      onPress: () => router.push("/(tabs)/(messages)"),
    },
  ] as const;

  const accountRows = [
    { key: "account", label: "Account settings", icon: "settings-outline" },
    { key: "edit", label: "Edit profile", icon: "create-outline" },
    { key: "notifications", label: "Notifications", icon: "notifications-outline" },
    { key: "privacy", label: "Privacy", icon: "lock-closed-outline" },
  ] as const;

  const supportRows = [
    { key: "public", label: "View public profile", icon: "person-circle-outline" },
    { key: "help", label: "Help & support", icon: "help-circle-outline" },
    { key: "logout", label: "Log out", icon: "log-out-outline" },
  ] as const;

  const handleRowPress = (label: string) => {
    if (label === "Log out") {
      Alert.alert("Log out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
            } finally {
              router.replace("/(auth)/sign-in");
            }
          },
        },
      ]);
      return;
    }
    Alert.alert("Coming soon", `${label} is not wired yet.`);
  };

  const renderSettingsCard = (
    rows: readonly { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[]
  ) => (
    <View style={styles.settingsCard}>
      {rows.map((row, index) => (
        <View key={row.key}>
          <Pressable style={styles.settingRow} onPress={() => handleRowPress(row.label)}>
            <View style={styles.settingIconWrap}>
              <Ionicons name={row.icon} size={18} color={appColors.textSecondary} />
            </View>
            <Text style={styles.settingLabel}>{row.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={appColors.textPlaceholder} />
          </Pressable>
          {index < rows.length - 1 ? <View style={styles.rowDivider} /> : null}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Profile</Text>
          <Pressable style={styles.headerActionButton} onPress={() => Alert.alert("Coming soon", "Notifications are coming soon.")}>
            <Ionicons name="notifications-outline" size={20} color={appColors.textPrimary} />
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.identityBlock}>
              <Text style={styles.userName}>{user?.name || "Guest User"}</Text>
              <Text style={styles.userSecondary}>{user?.email || "Add your email in profile setup"}</Text>
              <View style={[styles.statusBadge, isVerifiedStudent && styles.statusBadgeVerified]}>
                <Ionicons
                  name={isVerifiedStudent ? "checkmark-circle" : "school-outline"}
                  size={13}
                  color={isVerifiedStudent ? appColors.success : appColors.textMuted}
                />
                <Text style={[styles.statusBadgeText, isVerifiedStudent && styles.statusBadgeTextVerified]}>
                  {isVerifiedStudent ? "Verified Student" : "Campus Member"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            {stats.map((stat, index) => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                {index < stats.length - 1 ? <View style={styles.statDivider} /> : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <Pressable key={action.key} style={styles.quickActionCard} onPress={action.onPress}>
              <View style={styles.quickActionIcon}>
                <Ionicons name={action.icon} size={20} color={appColors.primary} />
              </View>
              <Text style={styles.quickActionTitle}>{action.label}</Text>
              <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.ctaCard} onPress={() => router.push("/(modals)/create-listing")}>
          <View style={styles.ctaIconWrap}>
            <Ionicons name="rocket-outline" size={22} color={appColors.primary} />
          </View>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Start Selling</Text>
            <Text style={styles.ctaBody}>Post a listing and reach buyers across campus.</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={appColors.primary} />
        </Pressable>

        <Text style={styles.sectionLabel}>Account</Text>
        {renderSettingsCard(accountRows)}

        <Text style={styles.sectionLabel}>Support</Text>
        {renderSettingsCard(supportRows)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: appColors.pageBackground },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 44 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: appColors.textPrimary,
    letterSpacing: -0.6,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    backgroundColor: appColors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 14,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: appColors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "700",
    color: appColors.textOnPrimary,
  },
  identityBlock: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: appColors.textPrimary,
    marginBottom: 2,
  },
  userSecondary: {
    fontSize: 14,
    color: appColors.textMuted,
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: appColors.surfaceSoftAlt,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeVerified: {
    backgroundColor: appColors.successSoft,
    borderColor: appColors.successBorder,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: appColors.textMuted,
  },
  statusBadgeTextVerified: {
    color: appColors.success,
  },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: appColors.borderSoft,
    paddingTop: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  statValue: {
    fontSize: 17,
    fontWeight: "700",
    color: appColors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: appColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  statDivider: {
    position: "absolute",
    right: 0,
    top: 2,
    height: 1,
    width: 20,
    transform: [{ rotate: "90deg" }],
    backgroundColor: appColors.borderSoft,
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },
  quickActionCard: {
    flex: 1,
    minHeight: 118,
    backgroundColor: appColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  quickActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: appColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: appColors.textPrimary,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: appColors.textMuted,
    lineHeight: 17,
  },
  ctaCard: {
    backgroundColor: appColors.surfaceSoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  ctaIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: appColors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  ctaContent: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: appColors.textPrimary,
    marginBottom: 2,
  },
  ctaBody: {
    fontSize: 13,
    color: appColors.textMuted,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: appColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 2,
  },
  settingsCard: {
    backgroundColor: appColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    marginBottom: 18,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 58,
    paddingHorizontal: 12,
    gap: 12,
  },
  settingIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: appColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    color: appColors.textPrimary,
    fontWeight: "500",
  },
  rowDivider: {
    height: 1,
    backgroundColor: appColors.borderSoft,
    marginLeft: 56,
  },
});
