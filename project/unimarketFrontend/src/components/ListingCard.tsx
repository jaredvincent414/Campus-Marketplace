// Card component for displaying a single listing
import React from "react";
import { View, Text, Pressable, StyleSheet, Alert, Image } from "react-native";
import { Listing } from "../types";
import { deleteListing } from "../services/api";

const CARD_RADIUS = 16;
const MEDIA_RADIUS = 14;

const CATEGORY_COLORS: Record<string, string> = {
  Books: "#F9D88A",
  Electronics: "#8EDFD0",
  Clothing: "#9DC7EA",
  Food: "#F9A0A0",
  Sports: "#B9A7F2",
  General: "#E9C4BA",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Books: "📚",
  Electronics: "💻",
  Clothing: "👕",
  Food: "🍕",
  Sports: "⚽",
  General: "🛍️",
};

interface ListingCardProps {
  listing: Listing;
  onPress?: () => void;
  userEmail?: string;
  onDelete?: () => void;
  featured?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPress,
  userEmail,
  onDelete,
  featured = false,
}) => {
  const isOwnListing = userEmail && userEmail === listing.userEmail;
  const category = listing.category || "General";
  const placeholderColor = CATEGORY_COLORS[category] ?? "#E8927C";
  const emoji = CATEGORY_EMOJIS[category] ?? "🛍️";
  const metadataLine = [listing.condition, listing.locationName].filter(Boolean).join(" • ");
  const hasImage = Boolean(listing.imageUrl);

  const handleLongPress = () => {
    if (!isOwnListing) return;
    Alert.alert("Delete Listing", "Are you sure you want to delete this listing?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteListing(listing._id);
            if (onDelete) onDelete();
          } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : "Failed to delete listing");
          }
        },
      },
    ]);
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={handleLongPress}
      style={({ pressed }) => [
        styles.card,
        featured && styles.cardFeatured,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.mediaContainer, featured && styles.mediaContainerFeatured]}>
        {hasImage ? (
          <Image
            source={{ uri: listing.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: placeholderColor }]}>
            <View style={styles.placeholderBlobOne} />
            <View style={styles.placeholderBlobTwo} />
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={styles.placeholderLabel}>{category}</Text>
          </View>
        )}
        {isOwnListing && (
          <View style={styles.ownerBadge}>
            <Text style={styles.ownerBadgeText}>Yours</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, featured && styles.titleFeatured]} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.category}>{category}</Text>
        {metadataLine ? <Text style={styles.metadata}>{metadataLine}</Text> : null}
        <Text style={styles.price}>
          <Text style={styles.priceAmount}>${listing.price.toFixed(2)}</Text>
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: CARD_RADIUS,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECECEC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
    overflow: "hidden",
  },
  cardFeatured: {
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.92,
  },
  mediaContainer: {
    width: "100%",
    height: 156,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: "hidden",
  },
  mediaContainerFeatured: {
    height: 220,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: MEDIA_RADIUS,
    borderTopRightRadius: MEDIA_RADIUS,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  placeholderBlobOne: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.18)",
    top: -20,
    right: -20,
  },
  placeholderBlobTwo: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.13)",
    bottom: -14,
    left: -12,
  },
  emoji: {
    fontSize: 42,
  },
  placeholderLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(34,34,34,0.8)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ownerBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ownerBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FF385C",
  },
  info: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 4,
    lineHeight: 20,
  },
  titleFeatured: {
    fontSize: 18,
    lineHeight: 24,
  },
  category: {
    fontSize: 12,
    color: "#6B6B6B",
    marginBottom: 2,
    fontWeight: "500",
  },
  metadata: {
    fontSize: 12,
    color: "#8A8A8A",
    marginBottom: 6,
  },
  price: {
    fontSize: 14,
    color: "#222222",
  },
  priceAmount: {
    fontWeight: "800",
    fontSize: 18,
  },
});


