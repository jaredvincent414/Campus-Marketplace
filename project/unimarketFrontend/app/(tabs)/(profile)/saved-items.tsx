import React, { useCallback, useState } from "react";
import { SafeAreaView, View, Text, StyleSheet, Pressable, ActivityIndicator, FlatList, Alert } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../../../src/contexts/UserContext";
import { ListingCard } from "../../../src/components/ListingCard";
import { fetchSavedListings, removeSavedListingForUser } from "../../../src/services/api";
import { Listing } from "../../../src/types";
import { appColors } from "../../../src/theme/colors";

export default function SavedItemsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unsavingListingId, setUnsavingListingId] = useState<string | null>(null);

  const loadSavedItems = useCallback(async () => {
    if (!user?.email) {
      setSavedListings([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const listings = await fetchSavedListings(user.email);
      setSavedListings(listings);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load saved items.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  useFocusEffect(
    useCallback(() => {
      loadSavedItems();
    }, [loadSavedItems])
  );

  const handleUnsave = async (listingId: string) => {
    if (!user?.email) return;

    try {
      setUnsavingListingId(listingId);
      await removeSavedListingForUser(user.email, listingId);
      setSavedListings((prev) => prev.filter((listing) => listing._id !== listingId));
    } catch (err) {
      Alert.alert("Unable to unsave item", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUnsavingListingId(null);
    }
  };

  const emptyState = (
    <View style={styles.emptyState}>
      <Ionicons name="bookmark-outline" size={40} color={appColors.textPlaceholder} />
      <Text style={styles.emptyTitle}>No saved items yet</Text>
      <Text style={styles.emptyBody}>
        Save listings from the marketplace and they will show up here.
      </Text>
      <Pressable style={styles.exploreButton} onPress={() => router.replace("/(tabs)/(market)")}>
        <Ionicons name="search-outline" size={16} color={appColors.textOnPrimary} />
        <Text style={styles.exploreButtonText}>Explore Listings</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color={appColors.textPrimary} />
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Saved Items</Text>
          <Text style={styles.subtitle}>
            {savedListings.length} saved {savedListings.length === 1 ? "listing" : "listings"}
          </Text>
        </View>
        <Pressable style={styles.refreshButton} onPress={loadSavedItems}>
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
            <Pressable style={styles.retryButton} onPress={loadSavedItems}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {!isLoading && !error ? (
          <FlatList
            data={savedListings}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              savedListings.length === 0 && styles.listContentEmpty,
            ]}
            ListEmptyComponent={emptyState}
            renderItem={({ item }) => {
              const isUnsaving = unsavingListingId === item._id;
              return (
                <View style={styles.savedItemBlock}>
                  <ListingCard
                    listing={item}
                    userEmail={user?.email}
                    onPress={() => {}}
                  />
                  <Pressable
                    style={[styles.unsaveButton, isUnsaving && styles.unsaveButtonDisabled]}
                    onPress={() => handleUnsave(item._id)}
                    disabled={isUnsaving}
                  >
                    {isUnsaving ? (
                      <ActivityIndicator size="small" color={appColors.primary} />
                    ) : (
                      <Ionicons name="bookmark" size={15} color={appColors.primary} />
                    )}
                    <Text style={styles.unsaveButtonText}>
                      {isUnsaving ? "Removing..." : "Unsave"}
                    </Text>
                  </Pressable>
                </View>
              );
            }}
          />
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
  listContent: {
    paddingBottom: 20,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  savedItemBlock: {
    marginBottom: 6,
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
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
  unsaveButton: {
    marginTop: -4,
    marginBottom: 12,
    alignSelf: "flex-end",
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
    backgroundColor: appColors.primarySoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    gap: 6,
  },
  unsaveButtonDisabled: {
    opacity: 0.75,
  },
  unsaveButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: appColors.primary,
  },
});
