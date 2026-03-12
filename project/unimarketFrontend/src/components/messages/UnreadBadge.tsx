import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { appColors } from "../../theme/colors";

interface UnreadBadgeProps {
  count: number;
}

export const UnreadBadge: React.FC<UnreadBadgeProps> = ({ count }) => {
  if (count <= 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: appColors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: appColors.textOnPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
});
