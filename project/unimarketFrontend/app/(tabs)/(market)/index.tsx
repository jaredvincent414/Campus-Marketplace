// Market tab - main marketplace feed with search
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, Modal, Pressable, Alert, ScrollView,
} from "react-native";
import { useListings } from "../../../src/contexts/ListingsContext";
import { useUser } from "../../../src/contexts/UserContext";
import { SearchBar } from "../../../src/components/SearchBar";
import { ListingList } from "../../../src/components/ListingList";
import { purchaseListing } from "../../../src/services/api";
import { Listing } from "../../../src/types";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = ["All", "Electronics", "Books", "Clothing", "Food", "Sports", "General"];

const CATEGORY_COLORS: Record<string, string> = {
  Books: "#FFD166",
  Electronics: "#06D6A0",
  Clothing: "#118AB2",
  Food: "#FF6B6B",
  Sports: "#8338EC",
  General: "#E8927C",
};

const HORIZONTAL_PADDING = 20;
const BRAND_COLOR = "#FF385C";

export default function MarketScreen() {
  const { listings, loadListings } = useListings();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  useEffect(() => {
    if (listings.length === 0) {
      loadListings();
    }
  }, []);

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || listing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  const hasActiveFilters = selectedCategory !== "All" || searchTerm.trim().length > 0;

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
  };

  const handleBuy = async () => {
    if (!selectedListing) return;
    if (!user?.email) {
      Alert.alert("Profile required", "Please add your profile before reserving listings.");
      return;
    }

    const isOwnListing = selectedListing.userEmail.toLowerCase() === user.email.toLowerCase();
    if (isOwnListing) {
      Alert.alert("Not allowed", "You cannot reserve your own listing.");
      return;
    }

    try {
      await purchaseListing(selectedListing._id, user.email);
      Alert.alert(
        "Purchase Successful!",
        `You bought "${selectedListing.title}" for $${selectedListing.price.toFixed(2)}`,
        [{ text: "OK", onPress: () => { setSelectedListing(null); loadListings(); } }]
      );
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to complete purchase");
    }
  };

  const singleListingFooter = filteredListings.length === 1 ? (
    <View style={styles.discoveryPanel}>
      <Text style={styles.discoveryTitle}>Want to keep browsing?</Text>
      <Text style={styles.discoveryBody}>
        Show all categories to find more listings around campus.
      </Text>
      <Pressable style={styles.discoveryButton} onPress={handleResetFilters}>
        <Ionicons name="sparkles-outline" size={16} color={BRAND_COLOR} />
        <Text style={styles.discoveryButtonText}>Explore all listings</Text>
      </Pressable>
    </View>
  ) : null;

  const selectedIsOwnListing = Boolean(
    selectedListing?.userEmail &&
    user?.email &&
    selectedListing.userEmail.toLowerCase() === user.email.toLowerCase()
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>UniMarket</Text>
        <Text style={styles.headerSubtitle}>Find great deals on campus</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchTerm}
          onChangeText={setSearchTerm}
          onPressFilter={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Listings */}
      <View style={styles.content}>
        <Text style={styles.resultsCount}>
          {filteredListings.length} {filteredListings.length === 1 ? "listing" : "listings"}
        </Text>
        <ListingList
          data={filteredListings}
          onPressListing={setSelectedListing}
          singleItemMode="featured"
          listFooter={singleListingFooter}
        />
      </View>

      {/* Listing Detail Modal */}
      <Modal
        visible={selectedListing !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedListing(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedListing && (
              <>
                <View style={[styles.modalImage, { backgroundColor: CATEGORY_COLORS[selectedListing.category] ?? "#E8927C" }]}>
                  <Pressable style={styles.closeButton} onPress={() => setSelectedListing(null)}>
                    <Ionicons name="close" size={20} color="#222222" />
                  </Pressable>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.modalTitleRow}>
                    <Text style={styles.modalTitle}>{selectedListing.title}</Text>
                    <Text style={styles.modalPrice}>${selectedListing.price.toFixed(2)}</Text>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.sectionLabel}>Category</Text>
                  <Text style={styles.sectionValue}>{selectedListing.category || "General"}</Text>

                  <Text style={styles.sectionLabel}>Description</Text>
                  <Text style={styles.sectionValue}>{selectedListing.description}</Text>

                  {selectedListing.userEmail && (
                    <>
                      <Text style={styles.sectionLabel}>Seller</Text>
                      <Text style={styles.sectionValue}>{selectedListing.userEmail}</Text>
                    </>
                  )}

                  <View style={styles.divider} />

                  <Pressable
                    style={[styles.buyButton, selectedIsOwnListing && styles.buyButtonDisabled]}
                    onPress={handleBuy}
                    disabled={selectedIsOwnListing}
                  >
                    <Text style={styles.buyButtonText}>
                      {selectedIsOwnListing
                        ? "You cannot reserve your own listing"
                        : `Reserve — $${selectedListing.price.toFixed(2)}`}
                    </Text>
                  </Pressable>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 31,
    fontWeight: "800",
    color: "#222222",
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#7A7A7A",
    marginTop: 3,
  },
  searchContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    marginTop: 14,
    marginBottom: 14,
  },
  categoriesScroll: {
    maxHeight: 44,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  categoryChip: {
    minHeight: 36,
    paddingHorizontal: 17,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8D8D8",
    backgroundColor: "#FFFFFF",
    marginRight: 10,
    justifyContent: "center",
  },
  categoryChipActive: {
    backgroundColor: BRAND_COLOR,
    borderColor: BRAND_COLOR,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#676767",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  resultsCount: {
    fontSize: 13,
    color: "#7A7A7A",
    marginBottom: 14,
    fontWeight: "600",
  },
  discoveryPanel: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    backgroundColor: "#FAFAFA",
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  discoveryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 6,
  },
  discoveryBody: {
    fontSize: 13,
    color: "#727272",
    lineHeight: 19,
  },
  discoveryButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FFD6DF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  discoveryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND_COLOR,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    overflow: "hidden",
  },
  modalImage: {
    height: 200,
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    padding: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalBody: {
    padding: 20,
  },
  modalTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222222",
    flex: 1,
    marginRight: 12,
  },
  modalPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222222",
  },
  divider: {
    height: 1,
    backgroundColor: "#EBEBEB",
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#717171",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  sectionValue: {
    fontSize: 15,
    color: "#222222",
    lineHeight: 22,
  },
  buyButton: {
    backgroundColor: "#FF385C",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  buyButtonDisabled: {
    backgroundColor: "#C5C5C5",
  },
  buyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

