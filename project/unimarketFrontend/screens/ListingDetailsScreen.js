import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    ScrollView,
} from "react-native";
import { fetchListingById, deleteListing } from "../api";

export default function ListingDetailsScreen({ route, navigation }) {
    const { listingId } = route.params;
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);

    // Load listing details
    useEffect(() => {
        const loadListing = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchListingById(listingId);
                setListing(data);
            } catch (err) {
                setError(err.message);
                Alert.alert("Error", "Failed to load listing details.");
            } finally {
                setLoading(false);
            }
        };

        loadListing();
    }, [listingId]);

    // Handle delete action
    const handleDelete = () => {
        Alert.alert(
            "Delete Listing",
            "Are you sure you want to delete this listing?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setDeleting(true);
                            await deleteListing(listingId);
                            Alert.alert("Success", "Listing deleted successfully", [
                                {
                                    text: "OK",
                                    onPress: () => {
                                        navigation.navigate("Listings");
                                    },
                                },
                            ]);
                        } catch (err) {
                            Alert.alert("Error", "Failed to delete listing.");
                            setDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#2F54D7" />
                <Text style={styles.loadingText}>Loading listing...</Text>
            </View>
        );
    }

    if (error || !listing) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>
                    {error || "Listing not found"}
                </Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>{listing.title}</Text>
                    <Text style={styles.price}>${listing.price.toFixed(2)}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Category</Text>
                    <Text style={styles.sectionValue}>
                        {listing.category || "General"}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Description</Text>
                    <Text style={styles.description}>{listing.description}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Created</Text>
                    <Text style={styles.sectionValue}>
                        {formatDate(listing.createdAt)}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
                    onPress={handleDelete}
                    disabled={deleting}
                >
                    {deleting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.deleteButtonText}>Delete Listing</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
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
    backButton: {
        backgroundColor: "#2F54D7",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    backButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    content: {
        padding: 16,
    },
    header: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 8,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#333",
        marginBottom: 8,
    },
    price: {
        fontSize: 28,
        fontWeight: "700",
        color: "#2F54D7",
    },
    section: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#666",
        textTransform: "uppercase",
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    sectionValue: {
        fontSize: 16,
        color: "#333",
    },
    description: {
        fontSize: 16,
        color: "#333",
        lineHeight: 24,
    },
    deleteButton: {
        backgroundColor: "#d32f2f",
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 24,
        marginBottom: 32,
    },
    deleteButtonDisabled: {
        opacity: 0.6,
    },
    deleteButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
