import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const EmptyInboxState: React.FC = () => (
  <View style={styles.container}>
    <View style={styles.iconWrap}>
      <Ionicons name="chatbubble-ellipses-outline" size={26} color="#FF385C" />
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
    backgroundColor: "#FFF1F4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#717171",
    textAlign: "center",
    lineHeight: 20,
  },
});
