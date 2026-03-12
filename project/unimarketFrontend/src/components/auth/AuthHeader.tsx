import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => (
  <View style={styles.wrap}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  title: {
    fontSize: 31,
    fontWeight: "800",
    color: "#1A1D2C",
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#60667E",
    lineHeight: 20,
  },
});
