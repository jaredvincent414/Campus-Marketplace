// Context for managing listings state across the app
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Listing } from "../types";
import { fetchListings, fetchListingsByUser } from "../services/api";

interface ListingsContextType {
  listings: Listing[];
  userListings: Listing[];
  isLoading: boolean;
  error: string | null;
  loadListings: () => Promise<void>;
  loadUserListings: (email: string) => Promise<void>;
  addListing: (listing: Listing) => void;
}

const ListingsContext = createContext<ListingsContextType | undefined>(
  undefined
);

export const ListingsProvider = ({ children }: { children: ReactNode }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadListings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchListings();
      setListings(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load listings";
      setError(errorMessage);
      console.error("Error loading listings:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserListings = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchListingsByUser(email);
      setUserListings(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load user listings";
      setError(errorMessage);
      console.error("Error loading user listings:", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const addListing = (listing: Listing) => {
    setListings((prev) => [listing, ...prev]);
    setUserListings((prev) => [listing, ...prev]);
  };

  return (
    <ListingsContext.Provider
      value={{
        listings,
        userListings,
        isLoading,
        error,
        loadListings,
        loadUserListings,
        addListing,
      }}
    >
      {children}
    </ListingsContext.Provider>
  );
};

/**
 * Hook to use listings context
 * Throws error if used outside ListingsProvider
 */
export const useListings = (): ListingsContextType => {
  const context = useContext(ListingsContext);
  if (context === undefined) {
    throw new Error("useListings must be used within a ListingsProvider");
  }
  return context;
};



