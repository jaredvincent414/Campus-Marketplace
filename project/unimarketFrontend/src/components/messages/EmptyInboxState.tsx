import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appColors } from "../../theme/colors";

export const EmptyInboxState: React.FC = () => (
  <View style={styles.container}>
    <View style={styles.iconWrap}>
      <Ionicons name="chatbubble-ellipses-outline" size={26} color={appColors.primary} />
    </View>
    <Text style={styles.title}>No messages yet</Text>
    <Text style={styles.subtitle}>
      Conversations with buyers and sellers will appear here.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 80,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: appColors.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: appColors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: appColors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});
