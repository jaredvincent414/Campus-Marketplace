import React from "react";
import { Pressable, View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ConversationListingContext } from "../../types";

interface ListingContextCardProps {
  listing: ConversationListingContext;
  onPress?: () => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  available: { label: "Available", color: "#1D7A38" },
  pending: { label: "Pending", color: "#A86500" },
  sold: { label: "Sold", color: "#666666" },
  deleted: { label: "Unavailable", color: "#666666" },
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
            <Ionicons name="image-outline" size={16} color="#8A8A8A" />
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

      {onPress ? <Ionicons name="chevron-forward" size={18} color="#9A9A9A" /> : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 16,
    padding: 10,
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#F6F6F6",
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
    color: "#222222",
    marginBottom: 2,
  },
  price: {
    fontSize: 13,
    color: "#222222",
    fontWeight: "600",
    marginBottom: 1,
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
  },
});
