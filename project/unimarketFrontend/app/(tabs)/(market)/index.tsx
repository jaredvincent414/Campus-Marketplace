// Market tab - main marketplace feed with search
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, Modal, Pressable, Alert, ScrollView, Image, Linking, Dimensions, ActivityIndicator, Animated, Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useListings } from "../../../src/contexts/ListingsContext";
import { useUser } from "../../../src/contexts/UserContext";
import { useSavedListings } from "../../../src/contexts/SavedListingsContext";
import { SearchBar } from "../../../src/components/SearchBar";
import { ListingList } from "../../../src/components/ListingList";
import { normalizeMediaUrl, purchaseListing } from "../../../src/services/api";
import { getOrCreateMessagingSocket } from "../../../src/services/socket";
import { Listing, ListingStatus } from "../../../src/types";
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
const BRANDEIS_LOGO_URI = "https://upload.wikimedia.org/wikipedia/en/thumb/c/c8/Brandeis_University_seal.svg/240px-Brandeis_University_seal.svg.png";
const HEADER_EXPANDED_HEIGHT = 266;
const HEADER_COLLAPSED_HEIGHT = 190;
const HEADER_SCROLL_DISTANCE = HEADER_EXPANDED_HEIGHT - HEADER_COLLAPSED_HEIGHT;

export default function MarketScreen() {
  const router = useRouter();
  const { listingId } = useLocalSearchParams<{ listingId?: string }>();
  const { listings, loadListings, syncListingStatus } = useListings();
  const { user } = useUser();
  const { isListingSaved, isSavePending, toggleSavedListing } = useSavedListings();
  const { openConversation, isLoading: openingConversation } = useCreateOrOpenConversation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const titleIntro = useRef(new Animated.Value(0)).current;
  const subtitleIntro = useRef(new Animated.Value(0)).current;
  const subtitleAmbient = useRef(new Animated.Value(0)).current;
  const searchIntro = useRef(new Animated.Value(0)).current;
  const chipsIntro = useRef(new Animated.Value(0)).current;
  const chipSelectionValues = useRef<Record<string, Animated.Value>>(
    CATEGORIES.reduce((acc, category) => {
      acc[category] = new Animated.Value(category === "All" ? 1 : 0);
      return acc;
    }, {} as Record<string, Animated.Value>)
  ).current;
  const requestedListingId = typeof listingId === "string" ? listingId.trim() : "";

  const collapseProgress = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_EXPANDED_HEIGHT, HEADER_COLLAPSED_HEIGHT],
    extrapolate: "clamp",
  });
  const brandScale = collapseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.83],
  });
  const brandLift = collapseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -11],
  });
  const subtitleFade = collapseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const subtitleLift = collapseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -9],
  });
  const subtitleAmbientOpacity = subtitleAmbient.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.9],
  });
  const subtitleAmbientLift = subtitleAmbient.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });
  const chipsLift = collapseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });
  const resultsOpacity = collapseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.32],
  });
  const resultsLift = collapseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -7],
  });
  const headerBadgeOpacity = collapseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.66],
  });
  const titleIntroLift = titleIntro.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const subtitleIntroLift = subtitleIntro.interpolate({
    inputRange: [0, 1],
    outputRange: [11, 0],
  });
  const searchIntroLift = searchIntro.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });
  const chipsIntroLift = chipsIntro.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });
  const animatedOnScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  useEffect(() => {
    if (listings.length === 0) {
      loadListings();
    }
  }, []);

  useEffect(() => {
    const socket = getOrCreateMessagingSocket(user?.email);

    const handleListingStatus = (payload: { listingId?: string; status?: ListingStatus }) => {
      if (!payload?.listingId || !payload?.status) return;
      syncListingStatus(payload.listingId, payload.status);

      setSelectedListing((prev) => {
        if (!prev || prev._id !== payload.listingId) return prev;
        const isActive = payload.status === "available" || payload.status === "pending";
        return isActive ? { ...prev, status: payload.status } : null;
      });
    };

    socket.on("listing:status", handleListingStatus);
    return () => {
      socket.off("listing:status", handleListingStatus);
    };
  }, [syncListingStatus, user?.email]);

  useEffect(() => {
    const introSequence = Animated.stagger(90, [
      Animated.timing(titleIntro, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(subtitleIntro, {
        toValue: 1,
        duration: 230,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(searchIntro, {
        toValue: 1,
        duration: 230,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(chipsIntro, {
        toValue: 1,
        duration: 230,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);
    introSequence.start();
  }, []);

  useEffect(() => {
    const subtitleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(subtitleAmbient, {
          toValue: 1,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(subtitleAmbient, {
          toValue: 0,
          duration: 1700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );

    subtitleLoop.start();
    return () => {
      subtitleLoop.stop();
    };
  }, [subtitleAmbient]);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const nextCompact = value > HEADER_SCROLL_DISTANCE * 0.56;
      setIsHeaderCompact((prev) => (prev === nextCompact ? prev : nextCompact));
    });

    return () => {
      scrollY.removeListener(id);
    };
  }, [scrollY]);

  useEffect(() => {
    const animations = CATEGORIES.map((category) =>
      Animated.timing(chipSelectionValues[category], {
        toValue: category === selectedCategory ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    );
    Animated.parallel(animations).start();
  }, [chipSelectionValues, selectedCategory]);

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
      <Animated.View style={[styles.headerShell, { height: headerHeight }]}>
        <View style={styles.headerGlowPrimary} />
        <View style={styles.headerGlowSecondary} />
        <View style={styles.headerInner}>
          <Animated.View
            style={[
              styles.brandRow,
              {
                opacity: titleIntro,
                transform: [
                  { translateY: Animated.add(titleIntroLift, brandLift) },
                ],
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.headerTitle,
                {
                  transform: [{ scale: brandScale }],
                },
              ]}
            >
              <Text style={styles.headerTitleLead}>Uni</Text>
              <Text style={styles.headerTitleAccent}>Market</Text>
            </Animated.Text>
            <Animated.View style={[styles.brandBadge, { opacity: headerBadgeOpacity }]}>
              <Image
                source={{ uri: BRANDEIS_LOGO_URI }}
                style={styles.brandLogo}
                resizeMode="cover"
              />
              <Text style={styles.brandBadgeText}>Brandeis</Text>
            </Animated.View>
          </Animated.View>

          <Animated.Text
            style={[
              styles.headerSubtitle,
              {
                opacity: Animated.multiply(
                  Animated.multiply(subtitleIntro, subtitleFade),
                  subtitleAmbientOpacity
                ),
                transform: [
                  {
                    translateY: Animated.add(
                      Animated.add(subtitleIntroLift, subtitleLift),
                      subtitleAmbientLift
                    ),
                  },
                ],
              },
            ]}
          >
            Discover student deals around campus.
          </Animated.Text>

          <Animated.View
            style={[
              styles.searchContainer,
              {
                opacity: searchIntro,
                transform: [{ translateY: searchIntroLift }],
              },
            ]}
          >
            <SearchBar
              value={searchTerm}
              onChangeText={setSearchTerm}
              onPressFilter={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
              placeholder="Search books, electronics, clothes..."
              compact={isHeaderCompact}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.categoriesWrap,
              {
                opacity: Animated.multiply(chipsIntro, collapseProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0.9],
                })),
                transform: [
                  { translateY: Animated.add(chipsIntroLift, chipsLift) },
                ],
              },
            ]}
          >
            <ScrollView
              horizontal
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
              contentContainerStyle={styles.categoriesContent}
            >
              {CATEGORIES.map((cat) => {
                const chipSelection = chipSelectionValues[cat];
                return (
                  <Animated.View
                    key={cat}
                    style={{
                      transform: [
                        {
                          scale: chipSelection.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.04],
                          }),
                        },
                        {
                          translateY: chipSelection.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -1],
                          }),
                        },
                      ],
                    }}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        styles.categoryChip,
                        selectedCategory === cat && styles.categoryChipActive,
                        pressed && styles.categoryChipPressed,
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                        {cat}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Animated.View>

          <Animated.Text
            style={[
              styles.resultsCount,
              {
                opacity: resultsOpacity,
                transform: [{ translateY: resultsLift }],
              },
            ]}
          >
            {filteredListings.length} {filteredListings.length === 1 ? "listing" : "listings"}
          </Animated.Text>
        </View>
      </Animated.View>

      <View style={styles.content}>
        <ListingList
          data={filteredListings}
          onPressListing={setSelectedListing}
          userEmail={user?.email}
          isListingSaved={isListingSaved}
          isSavePending={isSavePending}
          onToggleSaveListing={handleToggleSavedListing}
          singleItemMode="featured"
          listFooter={singleListingFooter}
          onScroll={animatedOnScroll}
          scrollEventThrottle={16}
          listContentContainerStyle={styles.listContentContainer}
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
  headerShell: {
    marginHorizontal: 14,
    marginTop: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    backgroundColor: appColors.surface,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 3,
  },
  headerGlowPrimary: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(47,84,215,0.14)",
    top: -108,
    right: -78,
  },
  headerGlowSecondary: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(47,84,215,0.09)",
    bottom: -98,
    left: -44,
  },
  headerInner: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 14,
    paddingBottom: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 33,
    fontWeight: "800",
    letterSpacing: -0.8,
  },
  headerTitleLead: {
    color: appColors.textPrimary,
  },
  headerTitleAccent: {
    color: appColors.primaryDark,
  },
  brandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: appColors.primarySoft,
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 2,
  },
  brandLogo: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
    backgroundColor: appColors.surface,
  },
  brandBadgeText: {
    color: appColors.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    marginTop: 8,
    maxWidth: "82%",
    fontSize: 13,
    lineHeight: 18,
    color: appColors.textMuted,
    fontWeight: "600",
  },
  searchContainer: {
    marginTop: 14,
  },
  categoriesWrap: {
    marginTop: 13,
  },
  categoriesScroll: {
    maxHeight: 42,
  },
  categoriesContent: {
    paddingLeft: 1,
    paddingRight: 24,
    alignItems: "center",
  },
  categoryChip: {
    minHeight: 34,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
    backgroundColor: appColors.surfaceSoft,
    marginRight: 9,
    justifyContent: "center",
  },
  categoryChipActive: {
    backgroundColor: BRAND_COLOR,
    borderColor: appColors.primaryDark,
    shadowColor: BRAND_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.24,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryChipPressed: {
    transform: [{ scale: 0.97 }],
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
    marginTop: 10,
  },
  listContentContainer: {
    paddingTop: 2,
  },
  resultsCount: {
    marginTop: 12,
    fontSize: 12,
    color: appColors.textMuted,
    marginBottom: 2,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
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
