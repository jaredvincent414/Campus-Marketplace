// API service for backend communication
import { Listing } from "../types";
import { Platform } from "react-native";


const DEV_HOST = "172.20.144.29"; 
const HOST = Platform.OS === "ios" ? "localhost" : Platform.OS === "android" ? "10.0.2.2" : DEV_HOST;
export const BASE_URL = __DEV__ ? `http://${HOST}:5000` : "http://localhost:5000";

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


