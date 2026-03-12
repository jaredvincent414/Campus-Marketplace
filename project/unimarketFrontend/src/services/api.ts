// API service for backend communication
import { Conversation, Listing, ListingMedia, ListingMediaType, Message } from "../types";

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
