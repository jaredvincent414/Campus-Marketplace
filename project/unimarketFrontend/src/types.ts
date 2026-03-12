// Type definitions for UniMarket app

export type ListingMediaType = "image" | "video";

export interface ListingMedia {
  type: ListingMediaType;
  url: string;
}

export interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  userEmail: string;
  imageUrl?: string;
  media?: ListingMedia[];
  condition?: string;
  locationName?: string;
  sellerName?: string;
  status?: ListingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export type ListingStatus = "available" | "pending" | "sold" | "deleted";
export type ConversationStatus = "active" | "archived" | "blocked" | "closed";

export interface ConversationListingContext {
  id: string;
  title: string;
  price: number;
  thumbnailUrl: string;
  status: ListingStatus;
}

export interface ConversationOtherUser {
  email: string;
  fullName: string;
}

export interface Conversation {
  id: string;
  listingId: string;
  buyerEmail: string;
  sellerEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  buyerUnreadCount: number;
  sellerUnreadCount: number;
  unreadCount: number;
  status: ConversationStatus;
  listing: ConversationListingContext;
  otherUser: ConversationOtherUser;
  createdAt?: string;
  updatedAt?: string;
}

export type MessageDeliveryStatus = "sending" | "sent" | "delivered" | "failed";

export interface Message {
  id: string;
  conversationId: string;
  senderEmail: string;
  body: string;
  sentAt: string;
  readAt?: string | null;
  deliveryStatus: MessageDeliveryStatus;
  createdAt?: string;
  updatedAt?: string;
}
