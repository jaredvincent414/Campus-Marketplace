// Card component for displaying a single listing
import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, Image, ActivityIndicator } from "react-native";
import { Listing } from "../types";
import { deleteListing, normalizeMediaUrl } from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { appColors } from "../theme/colors";

const CARD_RADIUS = 16;
const MEDIA_RADIUS = 14;

const CATEGORY_COLORS: Record<string, string> = {
  Books: "#BFD0FF",
  Electronics: "#A8D9F9",
  Clothing: "#C5CBFF",
  Food: "#F4C5B6",
  Sports: "#C5BEFF",
  General: "#D3DDFB",
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
  isSaved?: boolean;
  savePending?: boolean;
  onToggleSave?: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPress,
  userEmail,
  onDelete,
  featured = false,
  isSaved = false,
  savePending = false,
  onToggleSave,
}) => {
  const isOwnListing = Boolean(
    userEmail &&
    listing.userEmail &&
    userEmail.toLowerCase() === listing.userEmail.toLowerCase()
  );
  const canToggleSave = Boolean(onToggleSave) && !isOwnListing;
  const category = listing.category || "General";
  const placeholderColor = CATEGORY_COLORS[category] ?? "#D3DDFB";
  const emoji = CATEGORY_EMOJIS[category] ?? "🛍️";
  const metadataLine = [listing.condition, listing.locationName].filter(Boolean).join(" • ");
  const listingStatus = String(listing.status || "available").toLowerCase();
  const showStatusBadge = listingStatus !== "available";
  const statusLabel = listingStatus === "pending"
    ? "Pending"
    : listingStatus === "sold"
      ? "Sold"
      : listingStatus.charAt(0).toUpperCase() + listingStatus.slice(1);
  const media = listing.media || [];
  const imageUrls = Array.from(new Set(
    [
      normalizeMediaUrl(listing.imageUrl),
      ...media
        .filter((item) => item.type === "image")
        .map((item) => normalizeMediaUrl(item.url)),
    ].filter(Boolean) as string[]
  ));
  const primaryImage = imageUrls[0];
  const imageCount = imageUrls.length;
  const videoCount = media.filter((item) => item.type === "video").length;
  const [imageLoadError, setImageLoadError] = useState(false);
  const hasImage = Boolean(primaryImage) && !imageLoadError;

  useEffect(() => {
    setImageLoadError(false);
  }, [primaryImage, listing._id]);

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

  const handleToggleSavePress = (event: any) => {
    event?.stopPropagation?.();
    if (!canToggleSave || savePending) return;
    onToggleSave?.();
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
            source={{ uri: primaryImage }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageLoadError(true)}
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: placeholderColor }]}>
            <View style={styles.placeholderBlobOne} />
            <View style={styles.placeholderBlobTwo} />
            {videoCount > 0 ? (
              <Ionicons name="play-circle" size={44} color={appColors.textOnPrimary} />
            ) : (
              <Text style={styles.emoji}>{emoji}</Text>
            )}
            <Text style={styles.placeholderLabel}>{category}</Text>
          </View>
        )}
        {(videoCount > 0 || imageCount > 1) && (
          <View style={styles.mediaBadges}>
            {imageCount > 1 && (
              <View style={styles.mediaBadge}>
                <Ionicons name="images" size={12} color={appColors.textOnPrimary} />
                <Text style={styles.mediaBadgeText}>{imageCount}</Text>
              </View>
            )}
            {videoCount > 0 && (
              <View style={styles.mediaBadge}>
                <Ionicons name="videocam" size={12} color={appColors.textOnPrimary} />
                <Text style={styles.mediaBadgeText}>{videoCount}</Text>
              </View>
            )}
          </View>
        )}
        {canToggleSave ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSaved ? "Remove from saved" : "Save item"}
            onPress={handleToggleSavePress}
            disabled={savePending}
            style={({ pressed }) => [
              styles.saveButton,
              isSaved && styles.saveButtonActive,
              savePending && styles.saveButtonPending,
              pressed && styles.saveButtonPressed,
            ]}
          >
            {savePending ? (
              <ActivityIndicator size="small" color={isSaved ? appColors.textOnPrimary : appColors.primary} />
            ) : (
              <Ionicons
                name={isSaved ? "heart" : "heart-outline"}
                size={16}
                color={isSaved ? appColors.textOnPrimary : appColors.textPrimary}
              />
            )}
          </Pressable>
        ) : null}
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
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            <Text style={styles.priceAmount}>${listing.price.toFixed(2)}</Text>
          </Text>
          {showStatusBadge ? (
            <View
              style={[
                styles.statusBadge,
                listingStatus === "sold" ? styles.statusBadgeSold : styles.statusBadgePending,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  listingStatus === "sold" ? styles.statusBadgeTextSold : styles.statusBadgeTextPending,
                ]}
              >
                {statusLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: CARD_RADIUS,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
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
    color: "rgba(26,29,44,0.82)",
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
    color: appColors.primary,
  },
  saveButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonActive: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  saveButtonPending: {
    opacity: 0.86,
  },
  saveButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  mediaBadges: {
    position: "absolute",
    left: 10,
    top: 10,
    gap: 6,
  },
  mediaBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(34,34,34,0.74)",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mediaBadgeText: {
    color: appColors.textOnPrimary,
    fontSize: 11,
    fontWeight: "700",
  },
  info: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: appColors.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  titleFeatured: {
    fontSize: 18,
    lineHeight: 24,
  },
  category: {
    fontSize: 12,
    color: appColors.textMuted,
    marginBottom: 2,
    fontWeight: "500",
  },
  metadata: {
    fontSize: 12,
    color: appColors.textPlaceholder,
    marginBottom: 6,
  },
  price: {
    fontSize: 14,
    color: appColors.textPrimary,
  },
  priceRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  priceAmount: {
    fontWeight: "800",
    fontSize: 18,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusBadgePending: {
    backgroundColor: appColors.primarySoft,
    borderColor: appColors.primaryBorder,
  },
  statusBadgeSold: {
    backgroundColor: appColors.surfaceSoft,
    borderColor: appColors.borderSoft,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  statusBadgeTextPending: {
    color: appColors.primary,
  },
  statusBadgeTextSold: {
    color: appColors.textMuted,
  },
});
