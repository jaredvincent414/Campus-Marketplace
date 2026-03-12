import React from "react";
import { Pressable, View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ConversationListingContext } from "../../types";
import { appColors } from "../../theme/colors";

interface ListingContextCardProps {
  listing: ConversationListingContext;
  onPress?: () => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  available: { label: "Available", color: appColors.success },
  pending: { label: "Pending", color: appColors.warning },
  sold: { label: "Sold", color: appColors.textMuted },
  deleted: { label: "Unavailable", color: appColors.textMuted },
};

export const ListingContextCard: React.FC<ListingContextCardProps> = ({ listing, onPress }) => {
  const statusMeta = statusLabels[listing.status] || statusLabels.available;
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
      disabled={!onPress}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        {listing.thumbnailUrl ? (
          <Image source={{ uri: listing.thumbnailUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.fallback}>
            <Ionicons name="image-outline" size={16} color={appColors.textPlaceholder} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.price}>${Number(listing.price || 0).toFixed(2)}</Text>
        <Text style={[styles.status, { color: statusMeta.color }]}>{statusMeta.label}</Text>
      </View>

      {onPress ? <Ionicons name="chevron-forward" size={18} color={appColors.textPlaceholder} /> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    borderRadius: 16,
    padding: 10,
    backgroundColor: appColors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    opacity: 0.92,
  },
  imageWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: appColors.surfaceMuted,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  fallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: appColors.textPrimary,
    marginBottom: 2,
  },
  price: {
    fontSize: 13,
    color: appColors.textPrimary,
    fontWeight: "600",
    marginBottom: 1,
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
  },
});
