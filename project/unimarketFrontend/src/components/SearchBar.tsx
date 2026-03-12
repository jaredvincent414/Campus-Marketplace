// Search bar component for filtering listings
import React from "react";
import { View, TextInput, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appColors } from "../theme/colors";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onPressFilter?: () => void;
  hasActiveFilters?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onPressFilter,
  hasActiveFilters = false,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={appColors.textMuted} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder="Search items..."
        placeholderTextColor={appColors.textPlaceholder}
        value={value}
        onChangeText={onChangeText}
      />
      <Pressable
        onPress={onPressFilter}
        style={({ pressed }) => [
          styles.filterButton,
          hasActiveFilters && styles.filterButtonActive,
          pressed && styles.filterButtonPressed,
        ]}
      >
        <Ionicons
          name="options-outline"
          size={16}
          color={hasActiveFilters ? appColors.primary : appColors.textMuted}
        />
      </Pressable>
    </View>
  );
};

const RADIUS = 16;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: appColors.surface,
    borderRadius: RADIUS,
    minHeight: 54,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: appColors.textPrimary,
    fontWeight: "500",
    paddingVertical: 12,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appColors.surfaceMuted,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
  },
  filterButtonActive: {
    backgroundColor: appColors.primarySoft,
    borderColor: appColors.primaryBorder,
  },
  filterButtonPressed: {
    opacity: 0.85,
  },
});

