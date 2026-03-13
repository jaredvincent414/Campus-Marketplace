// Market tab - main marketplace feed with search
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, Modal, Pressable, Alert, ScrollView, Image, Linking, Dimensions, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useListings } from "../../../src/contexts/ListingsContext";
import { useUser } from "../../../src/contexts/UserContext";
import { useSavedListings } from "../../../src/contexts/SavedListingsContext";
import { SearchBar } from "../../../src/components/SearchBar";
import { ListingList } from "../../../src/components/ListingList";
import { normalizeMediaUrl, purchaseListing } from "../../../src/services/api";
import { Listing } from "../../../src/types";
import { useCreateOrOpenConversation } from "../../../src/hooks/useCreateOrOpenConversation";
import { Ionicons } from "@expo/vector-icons";
import { appColors } from "../../../src/theme/colors";

const CATEGORIES = ["All", "Electronics", "Books", "Clothing", "Food", "Sports", "General"];

const CATEGORY_COLORS: Record<string, string> = {
  Books: "#BFD0FF",
  Electronics: "#A8D9F9",
  Clothing: "#C5CBFF",
  Food: "#F4C5B6",
  Sports: "#C5BEFF",
  General: "#D3DDFB",
};

const HORIZONTAL_PADDING = 20;
const BRAND_COLOR = appColors.primary;
const MODAL_IMAGE_WIDTH = Dimensions.get("window").width;

export default function MarketScreen() {
  const router = useRouter();
  const { listingId } = useLocalSearchParams<{ listingId?: string }>();
  const { listings, loadListings } = useListings();
  const { user } = useUser();
  const { isListingSaved, isSavePending, toggleSavedListing } = useSavedListings();
  const { openConversation, isLoading: openingConversation } = useCreateOrOpenConversation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const requestedListingId = typeof listingId === "string" ? listingId.trim() : "";

  useEffect(() => {
    if (listings.length === 0) {
      loadListings();
    }
  }, []);

  useEffect(() => {
    if (!requestedListingId || selectedListing?._id === requestedListingId) return;
    const requestedListing = listings.find((listing) => listing._id === requestedListingId);
    if (requestedListing) {
      setSelectedListing(requestedListing);
    }
  }, [listings, requestedListingId, selectedListing?._id]);

  const clearRequestedListingParam = useCallback(() => {
    if (!requestedListingId) return;
    router.setParams({ listingId: "" });
  }, [requestedListingId, router]);

  const handleCloseListingModal = useCallback(() => {
    setSelectedListing(null);
    clearRequestedListingParam();
  }, [clearRequestedListingParam]);

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
        [{ text: "OK", onPress: () => { handleCloseListingModal(); loadListings(); } }]
      );
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to complete purchase");
    }
  };

  const handleMessageSeller = async () => {
    if (!selectedListing) return;
    if (!user?.email) {
      Alert.alert("Profile required", "Please add your profile before messaging a seller.");
      return;
    }

    if (selectedListing.userEmail.toLowerCase() === user.email.toLowerCase()) {
      Alert.alert("Not allowed", "You cannot message yourself about your own listing.");
      return;
    }

    try {
      const conversation = await openConversation(selectedListing._id, user.email);
      handleCloseListingModal();
      router.push({
        pathname: "/(tabs)/(messages)/[conversationId]",
        params: { conversationId: conversation.id },
      });
    } catch (error) {
      Alert.alert("Unable to open chat", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const handleToggleSavedListing = async (listing: Listing) => {
    if (!user?.email) {
      Alert.alert("Profile required", "Please sign in before saving listings.");
      return;
    }

    const isOwnListing = listing.userEmail.toLowerCase() === user.email.toLowerCase();
    if (isOwnListing) {
      Alert.alert("Not allowed", "You cannot save your own listing.");
      return;
    }

    try {
      await toggleSavedListing(listing);
    } catch (error) {
      Alert.alert("Unable to update saved items", error instanceof Error ? error.message : "Please try again.");
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
  const selectedMedia = selectedListing?.media || [];
  const selectedIsSaved = isListingSaved(selectedListing?._id);
  const isSavingSelectedListing = isSavePending(selectedListing?._id);
  const selectedImageUrls = Array.from(new Set(
    [
      normalizeMediaUrl(selectedListing?.imageUrl),
      ...selectedMedia
        .filter((item) => item.type === "image")
        .map((item) => normalizeMediaUrl(item.url)),
    ].filter(Boolean) as string[]
  ));
  const selectedVideos = selectedMedia.filter((item) => item.type === "video");

  const openMediaUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Invalid URL", "Cannot open this media link.");
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Failed to open media link.");
    }
  };

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [selectedListing?._id]);

  const handleImageSlideEnd = (event: any) => {
    const slideWidth = event?.nativeEvent?.layoutMeasurement?.width || 0;
    if (!slideWidth) return;
    const offsetX = event?.nativeEvent?.contentOffset?.x || 0;
    setSelectedImageIndex(Math.round(offsetX / slideWidth));
  };

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
          userEmail={user?.email}
          isListingSaved={isListingSaved}
          isSavePending={isSavePending}
          onToggleSaveListing={handleToggleSavedListing}
          singleItemMode="featured"
          listFooter={singleListingFooter}
        />
      </View>

      {/* Listing Detail Modal */}
      <Modal
        visible={selectedListing !== null}
        transparent
        animationType="slide"
        onRequestClose={handleCloseListingModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedListing && (
              <>
                <View style={[styles.modalImage, { backgroundColor: CATEGORY_COLORS[selectedListing.category] ?? "#D3DDFB" }]}>
                  {selectedImageUrls.length > 0 ? (
                    <>
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={handleImageSlideEnd}
                        style={styles.modalImageCarousel}
                      >
                        {selectedImageUrls.map((imageUrl) => (
                          <Image
                            key={imageUrl}
                            source={{ uri: imageUrl }}
                            style={styles.modalImageAsset}
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                      {selectedImageUrls.length > 1 && (
                        <View style={styles.modalImageDots}>
                          {selectedImageUrls.map((_, index) => (
                            <View
                              key={`dot-${index}`}
                              style={[styles.modalImageDot, selectedImageIndex === index && styles.modalImageDotActive]}
                            />
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.modalImageFallback}>
                      <Ionicons name="image-outline" size={44} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.modalImageFallbackText}>No image provided</Text>
                    </View>
                  )}

                  {selectedVideos.length > 0 && (
                    <Pressable
                      style={styles.modalVideoBadge}
                      onPress={() => openMediaUrl(selectedVideos[0].url)}
                    >
                      <Ionicons name="play" size={12} color={appColors.textOnPrimary} />
                      <Text style={styles.modalVideoBadgeText}>
                        {selectedVideos.length} {selectedVideos.length === 1 ? "video" : "videos"}
                      </Text>
                    </Pressable>
                  )}

                  <View style={styles.modalTopActions}>
                    {!selectedIsOwnListing ? (
                      <Pressable
                        style={[
                          styles.modalSaveButton,
                          selectedIsSaved && styles.modalSaveButtonActive,
                          isSavingSelectedListing && styles.messageButtonDisabled,
                        ]}
                        onPress={() => handleToggleSavedListing(selectedListing)}
                        disabled={isSavingSelectedListing}
                      >
                        {isSavingSelectedListing ? (
                          <ActivityIndicator
                            size="small"
                            color={selectedIsSaved ? appColors.textOnPrimary : appColors.primary}
                          />
                        ) : (
                          <Ionicons
                            name={selectedIsSaved ? "heart" : "heart-outline"}
                            size={17}
                            color={selectedIsSaved ? appColors.textOnPrimary : appColors.textPrimary}
                          />
                        )}
                      </Pressable>
                    ) : null}
                    <Pressable style={styles.closeButton} onPress={handleCloseListingModal}>
                      <Ionicons name="close" size={20} color={appColors.textPrimary} />
                    </Pressable>
                  </View>
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

                  {selectedVideos.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>Videos</Text>
                      {selectedVideos.map((video, index) => (
                        <Pressable
                          key={`${video.url}-${index}`}
                          style={styles.videoLinkRow}
                          onPress={() => openMediaUrl(video.url)}
                        >
                          <Ionicons name="play-circle-outline" size={18} color={BRAND_COLOR} />
                          <Text style={styles.videoLinkText}>
                            Watch video {index + 1}
                          </Text>
                        </Pressable>
                      ))}
                    </>
                  )}

                  {selectedListing.userEmail && (
                    <>
                      <Text style={styles.sectionLabel}>Seller</Text>
                      <Text style={styles.sectionValue}>{selectedListing.userEmail}</Text>
                    </>
                  )}

                  <View style={styles.divider} />

                  {!selectedIsOwnListing ? (
                    <>
                      <Pressable
                        style={[styles.messageButton, openingConversation && styles.messageButtonDisabled]}
                        onPress={handleMessageSeller}
                        disabled={openingConversation}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={16} color={appColors.primary} />
                        <Text style={styles.messageButtonText}>
                          {openingConversation ? "Opening chat..." : "Message Seller"}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={styles.buyButton}
                        onPress={handleBuy}
                      >
                        <Text style={styles.buyButtonText}>
                          {`Reserve — $${selectedListing.price.toFixed(2)}`}
                        </Text>
                      </Pressable>
                    </>
                  ) : null}
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
  container: { flex: 1, backgroundColor: appColors.pageBackground },
  header: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 31,
    fontWeight: "800",
    color: appColors.textPrimary,
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: appColors.textSecondary,
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
    borderColor: appColors.primaryBorderStrong,
    backgroundColor: appColors.surface,
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
    color: appColors.textMuted,
  },
  categoryChipTextActive: {
    color: appColors.textOnPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  resultsCount: {
    fontSize: 13,
    color: appColors.textMuted,
    marginBottom: 14,
    fontWeight: "600",
  },
  discoveryPanel: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    backgroundColor: appColors.surfaceSoft,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  discoveryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: appColors.textPrimary,
    marginBottom: 6,
  },
  discoveryBody: {
    fontSize: 13,
    color: appColors.textSecondary,
    lineHeight: 19,
  },
  discoveryButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: appColors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
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
    backgroundColor: appColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "88%",
    overflow: "hidden",
  },
  modalImage: {
    height: 200,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    overflow: "hidden",
  },
  modalImageCarousel: {
    ...StyleSheet.absoluteFillObject,
  },
  modalImageAsset: {
    width: MODAL_IMAGE_WIDTH,
    height: "100%",
  },
  modalImageFallback: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalImageFallbackText: {
    color: appColors.textOnPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  modalImageDots: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    zIndex: 2,
  },
  modalImageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  modalImageDotActive: {
    width: 16,
    backgroundColor: appColors.textOnPrimary,
  },
  modalTopActions: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: appColors.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 4,
  },
  modalSaveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalSaveButtonActive: {
    backgroundColor: appColors.primary,
    borderColor: appColors.primary,
  },
  modalVideoBadge: {
    position: "absolute",
    left: 16,
    top: 16,
    zIndex: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.58)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modalVideoBadgeText: {
    color: appColors.textOnPrimary,
    fontSize: 12,
    fontWeight: "700",
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
    color: appColors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  modalPrice: {
    fontSize: 22,
    fontWeight: "700",
    color: appColors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: appColors.divider,
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: appColors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  sectionValue: {
    fontSize: 15,
    color: appColors.textPrimary,
    lineHeight: 22,
  },
  videoLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
    borderRadius: 10,
    backgroundColor: appColors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
    gap: 8,
  },
  videoLinkText: {
    fontSize: 14,
    color: appColors.primary,
    fontWeight: "600",
  },
  buyButton: {
    backgroundColor: appColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  buyButtonText: {
    color: appColors.textOnPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  messageButton: {
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
    backgroundColor: appColors.primarySoft,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  messageButtonDisabled: {
    opacity: 0.6,
  },
  messageButtonText: {
    color: appColors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
});
