// Market tab - main marketplace feed with search
import React, { useState, useEffect } from "react";
import {
  View,Text,StyleSheet,SafeAreaView,RefreshControl,Modal,Pressable,Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useListings } from "../../../src/contexts/ListingsContext";
import { SearchBar } from "../../../src/components/SearchBar";
import { ListingList } from "../../../src/components/ListingList";
import { deleteListing } from "../../../src/services/api";
import { Listing } from "../../../src/types";

export default function MarketScreen() {
  const { listings, isLoading, loadListings, userListings } = useListings();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Load listings on mount if empty
  useEffect(() => {
    if (listings.length === 0) {
      loadListings();
    }
  }, []);

  // Filter listings based on search term
  const filteredListings = listings.filter((listing) =>
    listing.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePressListing = (listing: Listing) => {
    setSelectedListing(listing);
  };

  const handleBuy = async () => {
    if (selectedListing) {
      try {
        // Delete the listing from the database
        await deleteListing(selectedListing._id);
        
        // Show success message
        Alert.alert(
          "Purchase Successful",
          `You successfully bought "${selectedListing.title}" for $${selectedListing.price.toFixed(2)}!`,
          [
            {
              text: "OK",
              onPress: () => {
                setSelectedListing(null);
                // Reload listings to reflect the deletion
                loadListings();
              },
            },
          ]
        );
      } catch (error) {
        Alert.alert(
          "Error",
          error instanceof Error ? error.message : "Failed to complete purchase"
        );
      }
    }
  };

  const handleCancel = () => {
    setSelectedListing(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>UniMarket</Text>
      </View>

      <View style={styles.content}>
        <SearchBar value={searchTerm} onChangeText={setSearchTerm} />
        <ListingList
          data={filteredListings}
          onPressListing={handlePressListing}
        />
      </View>

      {/* Listing Details Modal */}
      <Modal
        visible={selectedListing !== null}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedListing && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedListing.title}</Text>
                  <Pressable
                    style={styles.closeButton}
                    onPress={handleCancel}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </Pressable>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Price:</Text>
                    <Text style={styles.detailValue}>
                      ${selectedListing.price.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Category:</Text>
                    <Text style={styles.detailValue}>
                      {selectedListing.category || "General"}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description:</Text>
                  </View>
                  <Text style={styles.description}>
                    {selectedListing.description}
                  </Text>

                  {selectedListing.userEmail && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Seller:</Text>
                      <Text style={styles.detailValue}>
                        {selectedListing.userEmail}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalButtons}>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.buyButton}
                    onPress={handleBuy}
                  >
                    <Text style={styles.buyButtonText}>Buy</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: "#666",
    fontWeight: "600",
  },
  modalBody: {
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#999",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buyButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  buyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});



