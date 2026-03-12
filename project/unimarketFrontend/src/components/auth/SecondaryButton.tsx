import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({ title, onPress }) => (
  <Pressable style={({ pressed }) => [styles.button, pressed && styles.pressed]} onPress={onPress}>
    <Text style={styles.title}>{title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#C9D5FA",
    backgroundColor: "#F6F9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.88,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2F54D7",
  },
});
