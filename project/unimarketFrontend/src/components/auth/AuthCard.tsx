import React from "react";
import { View, StyleSheet } from "react-native";

export const AuthCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.card}>{children}</View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E8ECF8",
    shadowColor: "#122356",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
});
