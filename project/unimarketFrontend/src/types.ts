// Type definitions for UniMarket app

export interface Listing {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  userEmail: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}



