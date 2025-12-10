// API helper for backend communication
// Change BASE_URL for production deployment
const BASE_URL = "http://localhost:5001";

/**
 * Fetch all listings from the backend
 */
export const fetchListings = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/listings`);
        if (!response.ok) {
            throw new Error("Failed to fetch listings");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

/**
 * Fetch a single listing by ID
 */
export const fetchListingById = async (id) => {
    try {
        const response = await fetch(`${BASE_URL}/api/listings/${id}`);
        if (!response.ok) {
            throw new Error("Failed to fetch listing");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

/**
 * Create a new listing
 */
export const createListing = async (data) => {
    try {
        const response = await fetch(`${BASE_URL}/api/listings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error("Failed to create listing");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

/**
 * Delete a listing by ID
 */
export const deleteListing = async (id) => {
    try {
        const response = await fetch(`${BASE_URL}/api/listings/${id}`, {
            method: "DELETE",
        });
        if (!response.ok) {
            throw new Error("Failed to delete listing");
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

