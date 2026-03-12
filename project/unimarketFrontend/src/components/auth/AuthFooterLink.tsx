import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

interface AuthFooterLinkProps {
  prompt: string;
  actionLabel: string;
  onPress: () => void;
}

export const AuthFooterLink: React.FC<AuthFooterLinkProps> = ({ prompt, actionLabel, onPress }) => (
  <View style={styles.row}>
    <Text style={styles.prompt}>{prompt} </Text>
    <Pressable onPress={onPress}>
      <Text style={styles.action}>{actionLabel}</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    flexWrap: "wrap",
  },
  prompt: {
    fontSize: 13,
    color: "#70789A",
  },
  action: {
    fontSize: 13,
    color: "#2F54D7",
    fontWeight: "700",
  },
});
