// Modal screen for creating a new listing
import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useListings } from "../../src/contexts/ListingsContext";
import { useUser } from "../../src/contexts/UserContext";
import { createListing } from "../../src/services/api";
import { LocationCoords } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = ["General", "Electronics", "Books", "Clothing", "Food", "Sports"];

export default function CreateListingScreen() {
  const router = useRouter();
  const { addListing } = useListings();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("General");
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleGetLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission was denied. You can still create a listing without location.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch (error) {
      Alert.alert("Error", "Failed to get location. Please try again.");
    } finally {
      setLocationLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) { Alert.alert("Required", "Please add a title"); return false; }
    if (!description.trim()) { Alert.alert("Required", "Please add a description"); return false; }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) { Alert.alert("Invalid Price", "Please enter a valid price"); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const newListing = await createListing({
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category || "General",
        userEmail: user?.email || "",
      });
      addListing(newListing);
      Alert.alert("Listed!", "Your item is now live.", [{ text: "Done", onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#222222" />
        </Pressable>
        <Text style={styles.headerTitle}>New Listing</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What are you selling?"
            placeholderTextColor="#AAAAAA"
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your item..."
            placeholderTextColor="#AAAAAA"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price *</Text>
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.priceInput}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              placeholderTextColor="#AAAAAA"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Category chips */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location (optional)</Text>
          <Pressable style={styles.locationButton} onPress={handleGetLocation} disabled={locationLoading}>
            {locationLoading ? (
              <ActivityIndicator size="small" color="#FF385C" />
            ) : (
              <>
                <Ionicons name={location ? "location" : "location-outline"} size={18} color={location ? "#FF385C" : "#717171"} />
                <Text style={[styles.locationButtonText, location && styles.locationButtonTextActive]}>
                  {location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : "Use my location"}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Submit */}
        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Publish listing</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB",
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
  },
  scrollContent: { padding: 20, paddingBottom: 48 },
  inputGroup: { marginBottom: 24 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222222",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#222222",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  textArea: { minHeight: 110, paddingTop: 14 },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222222",
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: "#222222",
    paddingVertical: 14,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  chipActive: {
    backgroundColor: "#222222",
    borderColor: "#222222",
  },
  chipText: { fontSize: 13, color: "#717171", fontWeight: "500" },
  chipTextActive: { color: "#FFFFFF" },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    gap: 8,
  },
  locationButtonText: { fontSize: 15, color: "#717171", fontWeight: "500" },
  locationButtonTextActive: { color: "#FF385C" },
  submitButton: {
    backgroundColor: "#FF385C",
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});



