// Search bar component for filtering listings
import React from "react";
import { View, TextInput, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
      <Ionicons name="search" size={18} color="#8A8A8A" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder="Search items..."
        placeholderTextColor="#717171"
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
          color={hasActiveFilters ? "#FF385C" : "#6E6E6E"}
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
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS,
    minHeight: 54,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E7E7E7",
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#222222",
    fontWeight: "500",
    paddingVertical: 12,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  filterButtonActive: {
    backgroundColor: "#FFF2F5",
    borderColor: "#FFD6DF",
  },
  filterButtonPressed: {
    opacity: 0.85,
  },
});


