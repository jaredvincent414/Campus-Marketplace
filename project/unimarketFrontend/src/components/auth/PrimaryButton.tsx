import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.button,
      (disabled || loading) && styles.buttonDisabled,
      pressed && !disabled && !loading && styles.buttonPressed,
    ]}
    onPress={onPress}
    disabled={disabled || loading}
  >
    {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.title}>{title}</Text>}
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: "#2F54D7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#18308C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonDisabled: {
    backgroundColor: "#9BAADE",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
