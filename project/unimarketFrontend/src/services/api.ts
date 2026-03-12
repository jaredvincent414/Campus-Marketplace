// API service for backend communication
import { Listing, ListingMedia, ListingMediaType } from "../types";

const LAN_HOST = "172.20.144.29";
export const BASE_URL = `http://${LAN_HOST}:5001`;
const LOCAL_HOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;

export const normalizeMediaUrl = (rawUrl?: string | null): string | undefined => {
  const url = String(rawUrl || "").trim();
  if (!url) return undefined;
  if (url.startsWith("/uploads/")) {
    return `${BASE_URL}${url}`;
  }
  if (LOCAL_HOST_PATTERN.test(url)) {
    return url.replace(LOCAL_HOST_PATTERN, BASE_URL);
  }
  return url;
};

/**
 * Fetches all listings from the backend
 */
export const fetchListings = async (): Promise<Listing[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/listings`);
    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch listings by user email
 */
export const fetchListingsByUser = async (email: string): Promise<Listing[]> => {
  try {
    const response = await fetch(`${BASE_URL}/api/listings/user/${encodeURIComponent(email)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user items: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch a single listing by ID
 */
export const fetchListingById = async (id: string): Promise<Listing> => {
  try {
    const response = await fetch(`${BASE_URL}/api/listings/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new listing
 */
export const createListing = async (data: {
  title: string;
  description: string;
  price: number;
  category: string;
  userEmail: string;
  imageUrl?: string;
  media?: ListingMedia[];
}): Promise<Listing> => {
  try {
    const response = await fetch(`${BASE_URL}/api/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create listing: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Upload an image or video file and return a public media reference
 */
export const uploadListingMedia = async (
  fileUri: string,
  mimeType = "image/jpeg",
  mediaTypeHint: ListingMediaType = "image"
): Promise<ListingMedia> => {
  try {
    const filename = fileUri.split("/").pop() || `listing-${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append("media", {
      uri: fileUri,
      type: mimeType,
      name: filename,
    } as any);

    const response = await fetch(`${BASE_URL}/api/listings/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      let message = `Failed to upload image: ${response.statusText}`;
      try {
        const data = await response.json();
        if (data?.message) {
          message = data.message;
        }
      } catch {
        // fallback message above
      }
      throw new Error(message);
    }

    const data = await response.json();
    if (!data?.url) {
      throw new Error("Upload response did not include a media URL");
    }
    return {
      type: data?.type === "video" ? "video" : mediaTypeHint,
      url: data.url,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Purchase a listing by ID
 */
export const purchaseListing = async (id: string, buyerEmail: string): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL}/api/listings/${id}/purchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ buyerEmail }),
    });

    if (!response.ok) {
      let message = `Failed to purchase listing: ${response.statusText}`;
      try {
        const data = await response.json();
        if (data?.message) {
          message = data.message;
        }
      } catch {
        // fallback message above
      }
      throw new Error(message);
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a listing by ID
 */
export const deleteListing = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL}/api/listings/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Failed to delete listing: ${response.statusText}`);
    }
  } catch (error) {
    throw error;
  }
};
