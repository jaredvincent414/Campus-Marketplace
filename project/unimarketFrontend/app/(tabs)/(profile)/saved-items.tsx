import React, { useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../../../src/contexts/UserContext";
import { useSavedListings } from "../../../src/contexts/SavedListingsContext";
import { Listing } from "../../../src/types";
import { ListingList } from "../../../src/components/ListingList";
import { appColors } from "../../../src/theme/colors";

export default function SavedItemsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const {
    savedListings,
    isLoading,
    error,
    refreshSavedListings,
    toggleSavedListing,
    isListingSaved,
    isSavePending,
  } = useSavedListings();

  useFocusEffect(
    useCallback(() => {
      refreshSavedListings();
    }, [refreshSavedListings])
  );

  const handleToggleSave = async (listing: Listing) => {
    try {
      await toggleSavedListing(listing);
    } catch (err) {
      Alert.alert("Unable to update saved item", err instanceof Error ? err.message : "Please try again.");
    }
  };

  const handleOpenListing = (listing: Listing) => {
    router.push({
      pathname: "/(tabs)/(market)",
      params: { listingId: listing._id },
    });
  };

  const emptyState = (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={40} color={appColors.textPlaceholder} />
      <Text style={styles.emptyTitle}>No saved items yet</Text>
      <Text style={styles.emptyBody}>Items you save will appear here.</Text>
      <Pressable style={styles.exploreButton} onPress={() => router.replace("/(tabs)/(market)")}>
        <Ionicons name="search-outline" size={16} color={appColors.textOnPrimary} />
        <Text style={styles.exploreButtonText}>Explore Listings</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {router.canGoBack() ? (
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={appColors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder}>
            <Ionicons name="heart" size={18} color={appColors.primary} />
          </View>
        )}
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Saved</Text>
          <Text style={styles.subtitle}>
            {savedListings.length} saved {savedListings.length === 1 ? "listing" : "listings"}
          </Text>
        </View>
        <Pressable style={styles.refreshButton} onPress={refreshSavedListings}>
          <Ionicons name="refresh-outline" size={18} color={appColors.primary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={appColors.primary} />
            <Text style={styles.stateText}>Loading saved items...</Text>
          </View>
        ) : null}

        {!isLoading && error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorTitle}>Could not load saved items</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={refreshSavedListings}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !error ? (
          savedListings.length > 0 ? (
            <ListingList
              data={savedListings}
              userEmail={user?.email}
              onPressListing={handleOpenListing}
              isListingSaved={isListingSaved}
              isSavePending={isSavePending}
              onToggleSaveListing={handleToggleSave}
            />
          ) : (
            emptyState
          )
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appColors.pageBackground,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: appColors.borderSoft,
    backgroundColor: appColors.surface,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: appColors.surfaceSoft,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: appColors.primarySoft,
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: appColors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: appColors.textMuted,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appColors.primarySoft,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  stateText: {
    marginTop: 10,
    fontSize: 14,
    color: appColors.textMuted,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: appColors.textPrimary,
    marginBottom: 8,
  },
  errorBody: {
    textAlign: "center",
    fontSize: 14,
    color: appColors.textMuted,
    marginBottom: 14,
  },
  retryButton: {
    minWidth: 96,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: appColors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: appColors.textOnPrimary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 19,
    fontWeight: "700",
    color: appColors.textPrimary,
  },
  emptyBody: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: appColors.textMuted,
  },
  exploreButton: {
    marginTop: 18,
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: appColors.primary,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: appColors.textOnPrimary,
  },
});
