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
  placeholder?: string;
  compact?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onPressFilter,
  hasActiveFilters = false,
  placeholder = "Search listings on campus...",
  compact = false,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        isFocused && styles.containerFocused,
      ]}
    >
      <View style={[styles.iconWrap, isFocused && styles.iconWrapFocused]}>
        <Ionicons
          name="search"
          size={compact ? 15 : 17}
          color={isFocused ? appColors.primary : appColors.textMuted}
        />
      </View>
      <TextInput
        style={[styles.input, compact && styles.inputCompact]}
        placeholder={placeholder}
        placeholderTextColor={appColors.textPlaceholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <Pressable
        onPress={onPressFilter}
        style={({ pressed }) => [
          styles.filterButton,
          compact && styles.filterButtonCompact,
          hasActiveFilters && styles.filterButtonActive,
          isFocused && styles.filterButtonFocused,
          pressed && styles.filterButtonPressed,
        ]}
      >
        <Ionicons
          name="options-outline"
          size={compact ? 15 : 16}
          color={hasActiveFilters ? appColors.primary : appColors.textMuted}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: appColors.surface,
    borderRadius: 18,
    minHeight: 56,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 9,
    elevation: 2,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
  },
  containerCompact: {
    minHeight: 50,
    borderRadius: 16,
    paddingVertical: 4,
  },
  containerFocused: {
    borderColor: appColors.primaryBorderStrong,
    shadowOpacity: 0.12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appColors.surfaceSoft,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    marginRight: 10,
  },
  iconWrapFocused: {
    backgroundColor: appColors.primarySoft,
    borderColor: appColors.primaryBorder,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: appColors.textPrimary,
    fontWeight: "600",
    paddingVertical: 11,
  },
  inputCompact: {
    fontSize: 13,
    paddingVertical: 9,
  },
  filterButton: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appColors.surfaceMuted,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
  },
  filterButtonCompact: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  filterButtonFocused: {
    borderColor: appColors.primaryBorder,
  },
  filterButtonActive: {
    backgroundColor: appColors.primarySoft,
    borderColor: appColors.primaryBorder,
  },
  filterButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
});
