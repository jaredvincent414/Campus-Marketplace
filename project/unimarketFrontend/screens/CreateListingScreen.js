import React, { useState } from "react";
import {View,Text,TextInput, TouchableOpacity,StyleSheet,ScrollView,Alert,ActivityIndicator,} from "react-native";
import * as Location from "expo-location";
import { createListing } from "../api";

export default function CreateListingScreen({ navigation }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [category, setCategory] = useState("General");
    const [location, setLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Request location permission and get coordinates
    const handleGetLocation = async () => {
        try {
            setLocationLoading(true);
            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permission Denied",
                    "Location permission is required to use this feature."
                );
                setLocationLoading(false);
                return;
            }

            // Get current position
            const position = await Location.getCurrentPositionAsync({});
            const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            };
            setLocation(coords);
        } catch (error) {
            Alert.alert("Error", "Failed to get location. Please try again.");
        } finally {
            setLocationLoading(false);
        }
    };

    // Validate form inputs
    const validateForm = () => {
        if (!title.trim()) {
            Alert.alert("Validation Error", "Title is required");
            return false;
        }
        if (!description.trim()) {
            Alert.alert("Validation Error", "Description is required");
            return false;
        }
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum < 0) {
            Alert.alert("Validation Error", "Please enter a valid price (>= 0)");
            return false;
        }
        return true;
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);
            const listingData = {
                title: title.trim(),
                description: description.trim(),
                price: parseFloat(price),
                category: category.trim() || "General",
            };

            await createListing(listingData);
            Alert.alert("Success", "Listing created successfully!", [
                {
                    text: "OK",
                    onPress: () => {
                        // Reset form
                        setTitle("");
                        setDescription("");
                        setPrice("");
                        setCategory("General");
                        setLocation(null);
                        // Navigate back to listings
                        navigation.navigate("Listings");
                    },
                },
            ]);
        } catch (error) {
            Alert.alert("Error", "Failed to create listing. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Title *</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Enter listing title"
                        placeholderTextColor="#999"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description *</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Enter listing description"
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Price *</Text>
                    <TextInput
                        style={styles.input}
                        value={price}
                        onChangeText={setPrice}
                        placeholder="0.00"
                        placeholderTextColor="#999"
                        keyboardType="decimal-pad"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Category</Text>
                    <TextInput
                        style={styles.input}
                        value={category}
                        onChangeText={setCategory}
                        placeholder="General"
                        placeholderTextColor="#999"
                    />
                </View>

                {/* Location Section */}
                <View style={styles.locationSection}>
                    <Text style={styles.label}>Location</Text>
                    <TouchableOpacity
                        style={styles.locationButton}
                        onPress={handleGetLocation}
                        disabled={locationLoading}
                    >
                        {locationLoading ? (
                            <ActivityIndicator size="small" color="#2F54D7" />
                        ) : (
                            <Text style={styles.locationButtonText}>Use My Location</Text>
                        )}
                    </TouchableOpacity>

                    {location && (
                        <View style={styles.locationDisplay}>
                            <Text style={styles.locationText}>
                                Lat: {location.latitude.toFixed(6)}
                            </Text>
                            <Text style={styles.locationText}>
                                Lon: {location.longitude.toFixed(6)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Create Listing</Text>
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
    form: {
        padding: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#333",
    },
    textArea: {
        minHeight: 100,
        paddingTop: 12,
    },
    locationSection: {
        marginBottom: 20,
    },
    locationButton: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#2F54D7",
        borderRadius: 8,
        padding: 12,
        alignItems: "center",
        marginTop: 8,
    },
    locationButtonText: {
        color: "#2F54D7",
        fontSize: 16,
        fontWeight: "600",
    },
    locationDisplay: {
        backgroundColor: "#e3f2fd",
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    locationText: {
        fontSize: 14,
        color: "#2F54D7",
        fontFamily: "monospace",
        marginBottom: 4,
    },
    submitButton: {
        backgroundColor: "#2F54D7",
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 8,
        marginBottom: 32,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
});
