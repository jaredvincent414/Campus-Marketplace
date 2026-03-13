import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { fetchListings } from "../api";

export default function ListingsScreen({ navigation }) {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load listings from backend
    const loadListings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchListings();
            setListings(data);
        } catch (err) {
            setError(err.message);
            Alert.alert("Error", "Failed to load listings. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Load listings on mount and when screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener("focus", () => {
            loadListings();
        });

        loadListings();

        return unsubscribe;
    }, [navigation, loadListings]);

    // Navigate to listing details
    const handlePressListing = (listing) => {
        navigation.navigate("ListingDetails", { listingId: listing._id, listing });
    };

    // Navigate to create listing screen
    const handleCreatePress = () => {
        navigation.navigate("CreateListing");
    };

    // Render each listing item
    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.listingItem}
            onPress={() => handlePressListing(item)}
        >
            <Text style={styles.listingTitle}>{item.title}</Text>
            <Text style={styles.listingPrice}>${item.price.toFixed(2)}</Text>
            <Text style={styles.listingCategory}>{item.category || "General"}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2F54D7" />
                <Text style={styles.loadingText}>Loading listings...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Error: {error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadListings}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={listings}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No listings found</Text>
                        <Text style={styles.emptySubtext}>
                            Tap the + button to create your first listing
                        </Text>
                    </View>
                }
            />
            {/* Floating action button to create new listing */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleCreatePress}
                activeOpacity={0.8}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#666",
    },
    errorText: {
        fontSize: 16,
        color: "#d32f2f",
        textAlign: "center",
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: "#2F54D7",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    listContainer: {
        padding: 16,
    },
    listingItem: {
        backgroundColor: "#fff",
        padding: 16,
        marginBottom: 12,
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    listingTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#333",
        marginBottom: 4,
    },
    listingPrice: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2F54D7",
        marginBottom: 4,
    },
    listingCategory: {
        fontSize: 14,
        color: "#666",
        fontStyle: "italic",
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        color: "#666",
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: "#999",
    },
    fab: {
        position: "absolute",
        right: 20,
        bottom: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#2F54D7",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    fabText: {
        fontSize: 32,
        color: "#fff",
        fontWeight: "300",
    },
});
