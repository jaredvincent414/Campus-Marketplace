// Modal screen for creating a new listing
import React, { useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useListings } from "../../src/contexts/ListingsContext";
import { useUser } from "../../src/contexts/UserContext";
import { createListing, uploadListingMedia } from "../../src/services/api";
import { LocationCoords, ListingMedia } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = ["General", "Electronics", "Books", "Clothing", "Food", "Sports"];
const MAX_MEDIA_ITEMS = 6;

export default function CreateListingScreen() {
  const router = useRouter();
  const { addListing } = useListings();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("General");
  const [mediaItems, setMediaItems] = useState<ListingMedia[]>([]);
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingType, setUploadingType] = useState<ListingMedia["type"] | null>(null);

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
    const imageCount = mediaItems.filter((item) => item.type === "image").length;
    if (imageCount === 0) {
      Alert.alert("Photo required", "Add at least one photo of the item.");
      return false;
    }
    return true;
  };

  const addMediaItem = (item: ListingMedia) => {
    if (mediaItems.length >= MAX_MEDIA_ITEMS) {
      Alert.alert("Media limit reached", `You can add up to ${MAX_MEDIA_ITEMS} files.`);
      return;
    }
    const duplicate = mediaItems.some((existing) => existing.url.toLowerCase() === item.url.toLowerCase());
    if (duplicate) {
      Alert.alert("Duplicate media", "That media file is already attached to this listing.");
      return;
    }
    setMediaItems((prev) => [...prev, item]);
  };

  const removeMediaItem = (index: number) => {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePickMediaFromDevice = async (type: ListingMedia["type"]) => {
    if (mediaItems.length >= MAX_MEDIA_ITEMS) {
      Alert.alert("Media limit reached", `You can add up to ${MAX_MEDIA_ITEMS} files.`);
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Permission Denied", "Media library access is needed to select photos.");
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          type === "video"
            ? ImagePicker.MediaTypeOptions.Videos
            : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: type === "image",
        quality: 0.75,
      });

      if (picked.canceled || !picked.assets?.[0]?.uri) {
        return;
      }

      const selectedImage = picked.assets[0];
      setUploadingType(type);
      const uploadedMedia = await uploadListingMedia(
        selectedImage.uri,
        selectedImage.mimeType || (type === "video" ? "video/mp4" : "image/jpeg"),
        type
      );
      addMediaItem(uploadedMedia);
    } catch (error) {
      Alert.alert("Upload failed", error instanceof Error ? error.message : "Could not upload selected media.");
    } finally {
      setUploadingType(null);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const primaryImageUrl = mediaItems.find((item) => item.type === "image")?.url;
      const newListing = await createListing({
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: category || "General",
        userEmail: user?.email || "",
        imageUrl: primaryImageUrl,
        media: mediaItems,
      });
      addListing(newListing);
      Alert.alert("Listed!", "Your item is now live.", [{ text: "Done", onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  const mediaEntries = mediaItems.map((item, index) => ({ item, index }));
  const imageEntries = mediaEntries.filter((entry) => entry.item.type === "image");
  const videoEntries = mediaEntries.filter((entry) => entry.item.type === "video");
  const videoCount = videoEntries.length;

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

        {/* Media */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Photos & Videos *</Text>
          <View style={styles.devicePickerRow}>
            <Pressable
              style={[styles.devicePickerButton, uploadingType !== null && styles.devicePickerButtonDisabled]}
              onPress={() => handlePickMediaFromDevice("image")}
              disabled={uploadingType !== null}
            >
              {uploadingType === "image" ? (
                <>
                  <ActivityIndicator size="small" color="#FF385C" />
                  <Text style={styles.devicePickerText}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="images-outline" size={18} color="#FF385C" />
                  <Text style={styles.devicePickerText}>Add photo</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[styles.devicePickerButton, uploadingType !== null && styles.devicePickerButtonDisabled]}
              onPress={() => handlePickMediaFromDevice("video")}
              disabled={uploadingType !== null}
            >
              {uploadingType === "video" ? (
                <>
                  <ActivityIndicator size="small" color="#FF385C" />
                  <Text style={styles.devicePickerText}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="videocam-outline" size={18} color="#FF385C" />
                  <Text style={styles.devicePickerText}>Add video</Text>
                </>
              )}
            </Pressable>
          </View>

          {imageEntries.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imageThumbRow}
            >
              {imageEntries.map(({ item, index }) => (
                <View key={`${item.type}-${item.url}-${index}`} style={styles.imageThumbWrap}>
                  <Image source={{ uri: item.url }} style={styles.imageThumb} resizeMode="cover" />
                  <Pressable
                    style={styles.thumbRemoveButton}
                    onPress={() => removeMediaItem(index)}
                  >
                    <Ionicons name="close" size={13} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {videoCount > 0 ? (
            <Text style={styles.mediaVideoCount}>
              {videoCount} {videoCount === 1 ? "video attached" : "videos attached"}
            </Text>
          ) : null}

          {videoEntries.length > 0 ? (
            <View style={styles.mediaList}>
              {videoEntries.map(({ item, index }, order) => (
                <View key={`${item.type}-${item.url}-${index}`} style={styles.mediaItem}>
                  <Ionicons name="videocam-outline" size={16} color="#6A6A6A" />
                  <Text style={styles.mediaItemText} numberOfLines={1}>
                    Video {order + 1} attached
                  </Text>
                  <Pressable
                    style={styles.mediaRemoveButton}
                    onPress={() => removeMediaItem(index)}
                  >
                    <Ionicons name="close" size={14} color="#7A7A7A" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : mediaItems.length === 0 ? (
            <Text style={styles.mediaHelperText}>
              Add up to {MAX_MEDIA_ITEMS} files from your device. At least one photo is required.
            </Text>
          ) : null}
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
  devicePickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FFD6DF",
    backgroundColor: "#FFF5F7",
    borderRadius: 12,
    minHeight: 48,
    marginBottom: 12,
  },
  devicePickerRow: {
    flexDirection: "row",
    gap: 10,
  },
  devicePickerButtonDisabled: {
    opacity: 0.7,
  },
  devicePickerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF385C",
  },
  imageThumbRow: {
    gap: 10,
    paddingVertical: 12,
  },
  imageThumbWrap: {
    width: 120,
    height: 90,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  imageThumb: {
    width: "100%",
    height: "100%",
  },
  thumbRemoveButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  mediaVideoCount: {
    marginBottom: 8,
    fontSize: 12,
    color: "#666666",
    fontWeight: "600",
  },
  mediaList: {
    marginTop: 2,
    gap: 8,
  },
  mediaItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  mediaItemText: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 13,
    color: "#555555",
  },
  mediaRemoveButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F3F3",
  },
  mediaHelperText: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
    color: "#808080",
  },
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
