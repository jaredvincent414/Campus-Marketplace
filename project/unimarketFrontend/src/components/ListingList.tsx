// List component for displaying multiple listings
import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Listing } from "../types";
import { ListingCard } from "./ListingCard";
import { appColors } from "../theme/colors";

interface ListingListProps {
  data: Listing[];
  onPressListing?: (listing: Listing) => void;
  userEmail?: string;
  onDeleteListing?: () => void;
  singleItemMode?: "grid" | "featured";
  listFooter?: React.ReactElement | null;
}

export const ListingList: React.FC<ListingListProps> = ({
  data,
  onPressListing,
  userEmail,
  onDeleteListing,
  singleItemMode = "grid",
  listFooter = null,
}) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🏪</Text>
        <Text style={styles.emptyText}>No listings yet</Text>
        <Text style={styles.emptySubtext}>Be the first to create a listing!</Text>
      </View>
    );
  }

  const featuredSingle = singleItemMode === "featured" && data.length === 1;
  const numColumns = featuredSingle ? 1 : 2;

  return (
    <FlatList
      key={`listing-columns-${numColumns}`}
      data={data}
      keyExtractor={(item) => item._id}
      numColumns={numColumns}
      columnWrapperStyle={numColumns === 2 ? styles.row : undefined}
      renderItem={({ item }) => (
        <View style={featuredSingle ? styles.featuredItemWrap : styles.gridItemWrap}>
          <ListingCard
            listing={item}
            onPress={onPressListing ? () => onPressListing(item) : undefined}
            userEmail={userEmail}
            onDelete={onDeleteListing}
            featured={featuredSingle}
          />
        </View>
      )}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={listFooter}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 28,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 2,
  },
  gridItemWrap: {
    flex: 1,
    maxWidth: "48.5%",
  },
  featuredItemWrap: {
    width: "100%",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: appColors.textPrimary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: appColors.textMuted,
    textAlign: "center",
  },
});

