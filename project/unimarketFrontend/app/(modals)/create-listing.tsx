// Modal screen for creating a new listing
import React, { useState } from "react";
import {View,Text,TextInput,Pressable,StyleSheet,ScrollView,KeyboardAvoidingView,Platform,Alert,ActivityIndicator,} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useListings } from "../../src/contexts/ListingsContext";
import { useUser } from "../../src/contexts/UserContext";
import { createListing } from "../../src/services/api";
import { LocationCoords } from "../../src/types";

export default function CreateListingScreen() {
  const router = useRouter();
  const { addListing } = useListings();
  const { user } = useUser();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("General");

  // Location state
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);

  // Handle location permission and get coordinates
  const handleGetLocation = async () => {
    try {
      setLocationLoading(true);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission was denied. You can still create a listing without location."
        );
        setLocationLoading(false);
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to get location. Please try again.");
      console.error("Location error:", error);
    } finally {
      setLocationLoading(false);
    }
  };

  // Validate form inputs
  const validateForm = (): boolean => {
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
        userEmail: user?.email || "",
      };

      const newListing = await createListing(listingData);

      // Add to context
      addListing(newListing);

      // Show success and navigate back
      Alert.alert("Success", "Listing created successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create listing";
      Alert.alert("Error", errorMessage);
      console.error("Create listing error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel action
  const handleCancel = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* Title Input */}
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

          {/* Description Input */}
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

          {/* Price Input */}
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

          {/* Category Input */}
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <Pressable
              style={styles.locationButton}
              onPress={handleGetLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <Text style={styles.locationButtonText}>Use My Location</Text>
              )}
            </Pressable>

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
          <Pressable
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Listing</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  scrollContent: {
    padding: 16,
  },
  form: {
    flex: 1,
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
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#333",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  locationButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#2563eb",
    alignItems: "center",
    marginTop: 8,
  },
  locationButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
  locationDisplay: {
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  locationText: {
    fontSize: 14,
    color: "#0369a1",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 4,
  },
  submitButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 16,
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



