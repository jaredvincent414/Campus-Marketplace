// Card component for displaying a single listing
import React from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { Listing } from "../types";
import { deleteListing } from "../services/api";

interface ListingCardProps {
  listing: Listing;
  onPress?: () => void;
  userEmail?: string;
  onDelete?: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPress,
  userEmail,
  onDelete,
}) => {
  // Check if current user owns this listing
  const isOwnListing = userEmail && userEmail === listing.userEmail;

  // Handle long press to delete
  const handleLongPress = () => {
    if (!isOwnListing) return;

    Alert.alert("Delete Listing", "Are you sure you want to delete this listing?", [
      {
        text: "Cancel",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deleteListing(listing._id);
            if (onDelete) {
              onDelete();
            }
            Alert.alert("Success", "Listing deleted successfully");
          } catch (error) {
            Alert.alert(
              "Error",
              error instanceof Error ? error.message : "Failed to delete listing"
            );
          }
        },
        style: "destructive",
      },
    ]);
  };

  const cardContent = (
    <View style={styles.card}>
      <Text style={styles.title}>{listing.title}</Text>
      <Text style={styles.price}>${listing.price.toFixed(2)}</Text>
      <Text style={styles.category}>{listing.category || "General"}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {listing.description}
      </Text>
    </View>
  );

  if (onPress || isOwnListing) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={handleLongPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2563eb",
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.7,
  },
});



