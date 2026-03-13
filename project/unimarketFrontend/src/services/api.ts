// API service for backend communication
import Constants from "expo-constants";
import { Platform } from "react-native";
import { Conversation, Listing, ListingMedia, ListingMediaType, Message, UserProfile } from "../types";

const API_PORT = "5001";
const EXPO_HOST_URI = (Constants.expoConfig as { hostUri?: string } | null)?.hostUri;
const EXPO_HOST = EXPO_HOST_URI ? EXPO_HOST_URI.split(":")[0] : null;
const FALLBACK_HOST = Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
const RESOLVED_HOST = EXPO_HOST || FALLBACK_HOST;
const OVERRIDE_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const BASE_URL = OVERRIDE_BASE_URL || `http://${RESOLVED_HOST}:${API_PORT}`;
const LOCAL_HOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;

const withNetworkHint = (error: unknown, action: string): Error => {
  const message = error instanceof Error ? error.message : String(error || "");
  if (/network request failed/i.test(message)) {
    return new Error(
      `${action} failed. Cannot reach backend at ${BASE_URL}. ` +
      "Start the backend and make sure your phone/simulator can access that host."
    );
  }
  return error instanceof Error ? error : new Error(`${action} failed`);
};

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

const normalizeUserProfile = (raw: any): UserProfile => ({
  _id: String(raw?._id || ""),
  name: String(raw?.name || "").trim(),
  email: String(raw?.email || "").trim().toLowerCase(),
  profileImageUrl: normalizeMediaUrl(raw?.profileImageUrl),
  savedListingIds: Array.isArray(raw?.savedListingIds)
    ? raw.savedListingIds.map((id: unknown) => String(id))
    : [],
  purchasesCount: Number.isFinite(Number(raw?.purchasesCount))
    ? Number(raw.purchasesCount)
    : 0,
  createdAt: raw?.createdAt,
  updatedAt: raw?.updatedAt,
});

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
    throw withNetworkHint(error, "Loading listings");
  }
};

/**
 * Create or update a user profile.
 */
export const upsertUserProfile = async (input: {
  name: string;
  email: string;
  profileImageUrl?: string;
}): Promise<UserProfile> => {
  try {
    const response = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new Error(`Failed to save user profile: ${response.statusText}`);
    }
    const raw = await response.json();
    return normalizeUserProfile(raw);
  } catch (error) {
    throw withNetworkHint(error, "Saving your profile");
  }
};

/**
 * Fetch a user profile by email.
 */
export const fetchUserProfile = async (email: string): Promise<UserProfile> => {
  try {
    const response = await fetch(`${BASE_URL}/api/users/${encodeURIComponent(email.trim().toLowerCase())}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }
    const raw = await response.json();
    return normalizeUserProfile(raw);
  } catch (error) {
    throw withNetworkHint(error, "Loading your profile");
  }
};

/**
 * Upload a profile image file and return the uploaded URL.
 */
export const uploadUserProfilePhoto = async (
  fileUri: string,
  mimeType = "image/jpeg"
): Promise<string> => {
  try {
    const filename = fileUri.split("/").pop() || `profile-${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append("media", {
      uri: fileUri,
      type: mimeType,
      name: filename,
    } as any);

    const response = await fetch(`${BASE_URL}/api/users/upload-photo`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      let message = `Failed to upload profile photo: ${response.statusText}`;
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
    const normalizedUrl = normalizeMediaUrl(data?.url);
    if (!normalizedUrl) {
      throw new Error("Upload response did not include a valid photo URL");
    }
    return normalizedUrl;
  } catch (error) {
    throw withNetworkHint(error, "Uploading profile photo");
  }
};

/**
 * Save a profile image URL to a user's profile.
 */
export const saveUserProfilePhoto = async (
  email: string,
  profileImageUrl: string
): Promise<UserProfile> => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/users/${encodeURIComponent(email.trim().toLowerCase())}/profile-photo`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileImageUrl }),
      }
    );
    if (!response.ok) {
      let message = `Failed to save profile photo: ${response.statusText}`;
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
    const raw = await response.json();
    return normalizeUserProfile(raw);
  } catch (error) {
    throw withNetworkHint(error, "Saving profile photo");
  }
};

/**
 * Fetch saved listings for the current user.
 */
export const fetchSavedListings = async (email: string): Promise<Listing[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/users/${encodeURIComponent(email.trim().toLowerCase())}/saved-listings`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch saved listings: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw withNetworkHint(error, "Loading saved items");
  }
};

/**
 * Save a listing for a user.
 */
export const saveListingForUser = async (email: string, listingId: string): Promise<UserProfile> => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/users/${encodeURIComponent(email.trim().toLowerCase())}/saved-listings/${encodeURIComponent(listingId)}`,
      {
        method: "POST",
      }
    );
    if (!response.ok) {
      let message = `Failed to save listing: ${response.statusText}`;
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
    const raw = await response.json();
    return normalizeUserProfile(raw);
  } catch (error) {
    throw withNetworkHint(error, "Saving item");
  }
};

/**
 * Remove a saved listing for a user.
 */
export const removeSavedListingForUser = async (
  email: string,
  listingId: string
): Promise<UserProfile> => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/users/${encodeURIComponent(email.trim().toLowerCase())}/saved-listings/${encodeURIComponent(listingId)}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) {
      let message = `Failed to remove saved listing: ${response.statusText}`;
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
    const raw = await response.json();
    return normalizeUserProfile(raw);
  } catch (error) {
    throw withNetworkHint(error, "Removing saved item");
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
    throw withNetworkHint(error, "Loading your listings");
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

/**
 * Mark listing as pending (seller action).
 */
export const markListingPending = async (listingId: string, userEmail: string): Promise<Listing> => {
  try {
    const response = await fetch(`${BASE_URL}/api/listings/${listingId}/mark-pending`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userEmail: userEmail.trim().toLowerCase(),
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to mark listing pending: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Mark listing as sold (seller action).
 */
export const markListingSold = async (listingId: string, userEmail: string): Promise<Listing> => {
  try {
    const response = await fetch(`${BASE_URL}/api/listings/${listingId}/mark-sold`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userEmail: userEmail.trim().toLowerCase(),
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to mark listing sold: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch conversations for a given user.
 */
export const fetchConversations = async (userEmail: string): Promise<Conversation[]> => {
  const normalizedEmail = userEmail.trim().toLowerCase();
  if (!normalizedEmail) return [];

  try {
    const response = await fetch(
      `${BASE_URL}/api/conversations?userEmail=${encodeURIComponent(normalizedEmail)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.statusText}`);
    }

    const raw = await response.json();
    return (Array.isArray(raw) ? raw : []).map((conversation) => ({
      ...conversation,
      listing: {
        ...conversation.listing,
        thumbnailUrl: normalizeMediaUrl(conversation?.listing?.thumbnailUrl) || "",
      },
    }));
  } catch (error) {
    throw error;
  }
};

/**
 * Create or open a listing-bound conversation.
 */
export const createOrOpenConversation = async (
  listingId: string,
  buyerEmail: string
): Promise<Conversation> => {
  try {
    const response = await fetch(`${BASE_URL}/api/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listingId,
        buyerEmail: buyerEmail.trim().toLowerCase(),
      }),
    });

    if (!response.ok) {
      let message = `Failed to open conversation: ${response.statusText}`;
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

    const conversation = await response.json();
    return {
      ...conversation,
      listing: {
        ...conversation.listing,
        thumbnailUrl: normalizeMediaUrl(conversation?.listing?.thumbnailUrl) || "",
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch one conversation detail.
 */
export const fetchConversationById = async (
  conversationId: string,
  userEmail: string
): Promise<Conversation> => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/conversations/${conversationId}?userEmail=${encodeURIComponent(
        userEmail.trim().toLowerCase()
      )}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch conversation: ${response.statusText}`);
    }

    const conversation = await response.json();
    return {
      ...conversation,
      listing: {
        ...conversation.listing,
        thumbnailUrl: normalizeMediaUrl(conversation?.listing?.thumbnailUrl) || "",
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Fetch messages for a conversation.
 */
export const fetchConversationMessages = async (
  conversationId: string,
  userEmail: string
): Promise<Message[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/api/conversations/${conversationId}/messages?userEmail=${encodeURIComponent(
        userEmail.trim().toLowerCase()
      )}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Send a message inside a conversation.
 */
export const sendConversationMessage = async (
  conversationId: string,
  senderEmail: string,
  body: string
): Promise<Message> => {
  try {
    const response = await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        senderEmail: senderEmail.trim().toLowerCase(),
        body: body.trim(),
      }),
    });

    if (!response.ok) {
      let message = `Failed to send message: ${response.statusText}`;
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
    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Mark a conversation as read for the current user.
 */
export const markConversationRead = async (
  conversationId: string,
  userEmail: string
): Promise<void> => {
  try {
    const response = await fetch(`${BASE_URL}/api/conversations/${conversationId}/read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userEmail: userEmail.trim().toLowerCase(),
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to mark conversation read: ${response.statusText}`);
    }
  } catch (error) {
    throw error;
  }
};
