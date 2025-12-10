// List component for displaying multiple listings
import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Listing } from "../types";
import { ListingCard } from "./ListingCard";

interface ListingListProps {
  data: Listing[];
  onPressListing?: (listing: Listing) => void;
  userEmail?: string;
  onDeleteListing?: () => void;
}

export const ListingList: React.FC<ListingListProps> = ({
  data,
  onPressListing,
  userEmail,
  onDeleteListing,
}) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No listings yet</Text>
        <Text style={styles.emptySubtext}>
          Be the first to create a listing!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <ListingCard
          listing={item}
          onPress={onPressListing ? () => onPressListing(item) : undefined}
          userEmail={userEmail}
          onDelete={onDeleteListing}
        />
      )}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
});


