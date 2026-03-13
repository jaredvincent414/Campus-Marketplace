import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchSavedListings, removeSavedListingForUser, saveListingForUser } from "../services/api";
import { Listing } from "../types";
import { useUser } from "./UserContext";

type SavedListingsContextValue = {
  savedListings: Listing[];
  savedListingIds: string[];
  isLoading: boolean;
  error: string | null;
  refreshSavedListings: () => Promise<void>;
  isListingSaved: (listingId?: string) => boolean;
  isSavePending: (listingId?: string) => boolean;
  toggleSavedListing: (listing: Listing) => Promise<void>;
};

const SavedListingsContext = createContext<SavedListingsContextValue | undefined>(undefined);

export const SavedListingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [savedListings, setSavedListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingById, setPendingById] = useState<Record<string, boolean>>({});

  const savedListingIds = useMemo(() => savedListings.map((listing) => listing._id), [savedListings]);
  const savedIdSet = useMemo(() => new Set(savedListingIds), [savedListingIds]);

  const refreshSavedListings = useCallback(async () => {
    if (!user?.email) {
      setSavedListings([]);
      setError(null);
      setPendingById({});
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

  useEffect(() => {
    refreshSavedListings();
  }, [refreshSavedListings]);

  const isListingSaved = useCallback(
    (listingId?: string) => (listingId ? savedIdSet.has(listingId) : false),
    [savedIdSet]
  );

  const isSavePending = useCallback(
    (listingId?: string) => (listingId ? Boolean(pendingById[listingId]) : false),
    [pendingById]
  );

  const toggleSavedListing = useCallback(async (listing: Listing) => {
    const listingId = String(listing?._id || "").trim();
    if (!listingId) {
      throw new Error("Listing ID is required.");
    }
    if (!user?.email) {
      throw new Error("Please sign in to save items.");
    }
    if (pendingById[listingId]) {
      return;
    }
    if (listing.userEmail?.toLowerCase() === user.email.toLowerCase()) {
      throw new Error("You cannot save your own listing.");
    }

    const wasSaved = savedIdSet.has(listingId);
    setPendingById((prev) => ({ ...prev, [listingId]: true }));
    setSavedListings((prev) =>
      wasSaved
        ? prev.filter((item) => item._id !== listingId)
        : [listing, ...prev.filter((item) => item._id !== listingId)]
    );

    try {
      if (wasSaved) {
        await removeSavedListingForUser(user.email, listingId);
      } else {
        await saveListingForUser(user.email, listingId);
      }
    } catch (err) {
      // Roll back only this listing to keep other optimistic updates intact.
      setSavedListings((prev) =>
        wasSaved
          ? [listing, ...prev.filter((item) => item._id !== listingId)]
          : prev.filter((item) => item._id !== listingId)
      );
      throw err instanceof Error ? err : new Error("Unable to update saved item.");
    } finally {
      setPendingById((prev) => {
        const next = { ...prev };
        delete next[listingId];
        return next;
      });
    }
  }, [pendingById, savedIdSet, user?.email]);

  return (
    <SavedListingsContext.Provider
      value={{
        savedListings,
        savedListingIds,
        isLoading,
        error,
        refreshSavedListings,
        isListingSaved,
        isSavePending,
        toggleSavedListing,
      }}
    >
      {children}
    </SavedListingsContext.Provider>
  );
};

export const useSavedListings = () => {
  const context = useContext(SavedListingsContext);
  if (!context) {
    throw new Error("useSavedListings must be used within SavedListingsProvider");
  }
  return context;
};
