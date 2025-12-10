// My Listings tab - shows user's listings
import React, { useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useListings } from "../../../src/contexts/ListingsContext";
import { useUser } from "../../../src/contexts/UserContext";
import { ListingList } from "../../../src/components/ListingList";
import { Listing } from "../../../src/types";

export default function MyListingsScreen() {
  const router = useRouter();
  const { userListings, loadUserListings, isLoading } = useListings();
  const { user } = useUser();

  // Load user listings when user email is available
  useEffect(() => {
    if (user?.email) {
      loadUserListings(user.email);
    }
  }, [user?.email]);

  const handlePressListing = (listing: Listing) => {
    // TODO: Navigate to listing details or edit screen
    console.log("Pressed listing:", listing._id);
  };

  const handleCreateListing = () => {
    router.push("/(modals)/create-listing");
  };

  const handleDeleteListing = () => {
    // Reload listings after deletion
    if (user?.email) {
      loadUserListings(user.email);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Listings</Text>
        <Pressable style={styles.addButton} onPress={handleCreateListing}>
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </Pressable>
      </View>
      <View style={styles.content}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : userListings.length === 0 ? (
          <Text style={styles.emptyText}>No listings yet</Text>
        ) : (
          <ListingList
            data={userListings}
            onPressListing={handlePressListing}
            userEmail={user?.email}
            onDeleteListing={handleDeleteListing}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 20,
  },
});


