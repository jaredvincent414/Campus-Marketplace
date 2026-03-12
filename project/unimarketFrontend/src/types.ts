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
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

