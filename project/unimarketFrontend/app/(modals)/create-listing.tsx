// Modal screen for creating a new listing
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { useListings } from "../../src/contexts/ListingsContext";
import { useUser } from "../../src/contexts/UserContext";
import { createListing, uploadListingMedia } from "../../src/services/api";
import { LocationCoords, ListingMedia } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";
import { appColors } from "../../src/theme/colors";

const CATEGORIES = ["General", "Electronics", "Books", "Clothing", "Food", "Sports"];
const MAX_MEDIA_ITEMS = 6;
type FormField = "title" | "description" | "price";

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
  const [focusedField, setFocusedField] = useState<FormField | null>(null);
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);

  const mediaEntries = mediaItems.map((item, index) => ({ item, index }));
  const imageEntries = mediaEntries.filter((entry) => entry.item.type === "image");
  const videoEntries = mediaEntries.filter((entry) => entry.item.type === "video");
  const titleError = didAttemptSubmit && !title.trim();
  const descriptionError = didAttemptSubmit && !description.trim();
  const priceNumber = parseFloat(price);
  const priceError = didAttemptSubmit && (Number.isNaN(priceNumber) || priceNumber < 0);
  const mediaError = didAttemptSubmit && imageEntries.length === 0;
  const canSubmit =
    !!title.trim() &&
    !!description.trim() &&
    !Number.isNaN(priceNumber) &&
    priceNumber >= 0 &&
    imageEntries.length > 0 &&
    !submitting &&
    uploadingType === null;

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/(market)");
  };

  const handleGetLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access was denied. You can still publish without location.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch {
      Alert.alert("Error", "Failed to get location. Please try again.");
    } finally {
      setLocationLoading(false);
    }
  };

  const validateForm = (): boolean => {
    return (
      !!title.trim() &&
      !!description.trim() &&
      !Number.isNaN(priceNumber) &&
      priceNumber >= 0 &&
      imageEntries.length > 0
    );
  };

  const addMediaItems = (items: ListingMedia[]) => {
    if (!items.length) return;

    const nextMediaItems = [...mediaItems];
    let duplicateCount = 0;
    let skippedForLimit = 0;

    items.forEach((item) => {
      const duplicate = nextMediaItems.some(
        (existing) => existing.url.toLowerCase() === item.url.toLowerCase()
      );
      if (duplicate) {
        duplicateCount += 1;
        return;
      }
      if (nextMediaItems.length >= MAX_MEDIA_ITEMS) {
        skippedForLimit += 1;
        return;
      }
      nextMediaItems.push(item);
    });

    if (nextMediaItems.length !== mediaItems.length) {
      setMediaItems(nextMediaItems);
    }

    if (duplicateCount > 0) {
      Alert.alert(
        "Duplicate media",
        `${duplicateCount} selected ${duplicateCount === 1 ? "file is" : "files are"} already attached.`
      );
    }
    if (skippedForLimit > 0) {
      Alert.alert("Media limit reached", `You can add up to ${MAX_MEDIA_ITEMS} files.`);
    }
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
        Alert.alert("Permission Denied", "Media library access is needed to select files.");
        return;
      }

      const remainingSlots = MAX_MEDIA_ITEMS - mediaItems.length;
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          type === "video"
            ? ImagePicker.MediaTypeOptions.Videos
            : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        allowsMultipleSelection: type === "image",
        selectionLimit: type === "image" ? remainingSlots : 1,
        quality: 0.75,
      });

      if (picked.canceled || !picked.assets?.length) {
        return;
      }

      setUploadingType(type);
      const assetsToUpload =
        type === "image"
          ? picked.assets.slice(0, remainingSlots)
          : picked.assets.slice(0, 1);

      const uploadResults = await Promise.all(
        assetsToUpload
          .filter((asset) => !!asset.uri)
          .map(async (asset) => {
            try {
              const uploadedMedia = await uploadListingMedia(
                asset.uri,
                asset.mimeType || (type === "video" ? "video/mp4" : "image/jpeg"),
                type
              );
              return { item: uploadedMedia };
            } catch {
              return { item: null };
            }
          })
      );

      const successfulUploads = uploadResults
        .map((result) => result.item)
        .filter((item): item is ListingMedia => Boolean(item));
      const failedCount = uploadResults.length - successfulUploads.length;
      addMediaItems(successfulUploads);

      if (failedCount > 0) {
        Alert.alert(
          "Some uploads failed",
          `${failedCount} ${failedCount === 1 ? "file was" : "files were"} not uploaded.`
        );
      }
    } catch (error) {
      Alert.alert("Upload failed", error instanceof Error ? error.message : "Could not upload selected media.");
    } finally {
      setUploadingType(null);
    }
  };

  const handleSubmit = async () => {
    setDidAttemptSubmit(true);
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
      Alert.alert("Listed!", "Your item is now live.", [{ text: "Done", onPress: handleClose }]);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <View style={styles.kickerPill}>
              <Ionicons name="create-outline" size={14} color={appColors.primary} />
              <Text style={styles.kickerText}>Create Listing</Text>
            </View>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={20} color={appColors.textPrimary} />
            </Pressable>
          </View>
          <Text style={styles.headerTitle}>New Listing</Text>
          <Text style={styles.headerSubtitle}>
            Add details buyers care about first, then make your photos shine.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          <Text style={styles.sectionHint}>Clear and specific details help your listing sell faster.</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={[
                styles.textInput,
                focusedField === "title" && styles.textInputFocused,
                titleError && styles.textInputError,
              ]}
              value={title}
              onFocus={() => setFocusedField("title")}
              onBlur={() => setFocusedField(null)}
              onChangeText={setTitle}
              placeholder="What are you selling?"
              placeholderTextColor={appColors.textPlaceholder}
            />
            {titleError ? <Text style={styles.errorText}>Please add a title.</Text> : null}
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                focusedField === "description" && styles.textInputFocused,
                descriptionError && styles.textInputError,
              ]}
              value={description}
              onFocus={() => setFocusedField("description")}
              onBlur={() => setFocusedField(null)}
              onChangeText={setDescription}
              placeholder="Condition, age, what's included, and why you're selling."
              placeholderTextColor={appColors.textPlaceholder}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            {descriptionError ? (
              <Text style={styles.errorText}>Please add a description.</Text>
            ) : (
              <Text style={styles.helperText}>Give buyers enough context to decide quickly.</Text>
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Pricing & Category</Text>
          <Text style={styles.sectionHint}>Keep the price realistic for your campus market.</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Price *</Text>
            <View
              style={[
                styles.priceField,
                focusedField === "price" && styles.textInputFocused,
                priceError && styles.textInputError,
              ]}
            >
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyBadgeText}>$</Text>
              </View>
              <TextInput
                style={styles.priceInput}
                value={price}
                onChangeText={setPrice}
                onFocus={() => setFocusedField("price")}
                onBlur={() => setFocusedField(null)}
                placeholder="0.00"
                placeholderTextColor={appColors.textPlaceholder}
                keyboardType="decimal-pad"
              />
            </View>
            {priceError ? <Text style={styles.errorText}>Enter a valid price.</Text> : null}
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {CATEGORIES.map((cat) => {
                const selected = category === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      selected && styles.categoryChipActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.categoryChipText, selected && styles.categoryChipTextActive]}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Photos & Video</Text>
            <Text style={styles.sectionCounter}>
              {mediaItems.length}/{MAX_MEDIA_ITEMS}
            </Text>
          </View>
          <Text style={styles.sectionHint}>At least one photo is required to publish.</Text>

          <Pressable
            onPress={() => handlePickMediaFromDevice("image")}
            disabled={uploadingType !== null}
            style={({ pressed }) => [
              styles.photoUploadCard,
              imageEntries.length > 0 && styles.photoUploadCardFilled,
              mediaError && styles.photoUploadCardError,
              uploadingType === "image" && styles.photoUploadCardBusy,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.photoUploadIcon}>
              {uploadingType === "image" ? (
                <ActivityIndicator size="small" color={appColors.primary} />
              ) : (
                <Ionicons name="images-outline" size={24} color={appColors.primary} />
              )}
            </View>
            <Text style={styles.photoUploadTitle}>
              {uploadingType === "image"
                ? "Uploading photo..."
                : imageEntries.length > 0
                  ? "Add More Photos"
                  : "Upload Photos"}
            </Text>
            <Text style={styles.photoUploadSubtitle}>
              {imageEntries.length > 0
                ? `${imageEntries.length} ${imageEntries.length === 1 ? "photo" : "photos"} attached`
                : "Show multiple angles and important details."}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => handlePickMediaFromDevice("video")}
            disabled={uploadingType !== null}
            style={({ pressed }) => [
              styles.videoUploadRow,
              videoEntries.length > 0 && styles.videoUploadRowActive,
              pressed && styles.pressed,
            ]}
          >
            {uploadingType === "video" ? (
              <ActivityIndicator size="small" color={appColors.primary} />
            ) : (
              <Ionicons name="videocam-outline" size={18} color={appColors.primary} />
            )}
            <Text style={styles.videoUploadText}>
              {uploadingType === "video"
                ? "Uploading video..."
                : videoEntries.length > 0
                  ? `${videoEntries.length} ${videoEntries.length === 1 ? "video" : "videos"} attached`
                  : "Add optional video"}
            </Text>
          </Pressable>

          {imageEntries.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previewRow}
            >
              {imageEntries.map(({ item, index }) => (
                <View key={`${item.type}-${item.url}-${index}`} style={styles.previewTile}>
                  <Image source={{ uri: item.url }} style={styles.previewImage} resizeMode="cover" />
                  <Pressable
                    style={({ pressed }) => [styles.previewRemoveButton, pressed && styles.pressed]}
                    onPress={() => removeMediaItem(index)}
                  >
                    <Ionicons name="close" size={13} color={appColors.textOnPrimary} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {videoEntries.length > 0 ? (
            <View style={styles.videoList}>
              {videoEntries.map(({ item, index }, order) => (
                <View key={`${item.type}-${item.url}-${index}`} style={styles.videoListItem}>
                  <Ionicons name="film-outline" size={16} color={appColors.textMuted} />
                  <Text style={styles.videoListText} numberOfLines={1}>
                    Video {order + 1}
                  </Text>
                  <Pressable
                    style={({ pressed }) => [styles.mediaRemoveButton, pressed && styles.pressed]}
                    onPress={() => removeMediaItem(index)}
                  >
                    <Ionicons name="close" size={13} color={appColors.textMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {mediaError ? (
            <Text style={styles.errorText}>Add at least one photo to publish this listing.</Text>
          ) : (
            <Text style={styles.helperText}>Use up to {MAX_MEDIA_ITEMS} files total.</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Location (Optional)</Text>
          <Text style={styles.sectionHint}>Helps nearby buyers find your listing faster.</Text>

          <Pressable
            onPress={handleGetLocation}
            disabled={locationLoading}
            style={({ pressed }) => [
              styles.locationRow,
              location && styles.locationRowActive,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.locationIcon}>
              {locationLoading ? (
                <ActivityIndicator size="small" color={appColors.primary} />
              ) : (
                <Ionicons
                  name={location ? "location" : "location-outline"}
                  size={18}
                  color={location ? appColors.primary : appColors.textMuted}
                />
              )}
            </View>
            <View style={styles.locationTextWrap}>
              <Text style={styles.locationTitle}>{location ? "Location added" : "Use my location"}</Text>
              <Text style={styles.locationSubtitle}>
                {location
                  ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                  : "Tap to share your current coordinates"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={appColors.textPlaceholder} />
          </Pressable>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            !canSubmit && styles.submitButtonDisabled,
            pressed && canSubmit && styles.pressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={appColors.textOnPrimary} />
          ) : (
            <Text style={styles.submitButtonText}>Publish Listing</Text>
          )}
        </Pressable>
        <Text style={styles.submitCaption}>
          Complete required fields and at least one photo to publish.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: appColors.pageBackground },
  scrollContent: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 44 },
  headerCard: {
    backgroundColor: appColors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kickerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
    backgroundColor: appColors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  kickerText: {
    fontSize: 12,
    fontWeight: "700",
    color: appColors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    backgroundColor: appColors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    marginTop: 14,
    fontSize: 29,
    fontWeight: "800",
    color: appColors.textPrimary,
    letterSpacing: -0.7,
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: appColors.textSecondary,
    lineHeight: 20,
  },
  sectionCard: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    backgroundColor: appColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: appColors.textPrimary,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionCounter: {
    fontSize: 12,
    fontWeight: "700",
    color: appColors.textMuted,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: appColors.surfaceSoftAlt,
  },
  sectionHint: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 12,
    color: appColors.textSubtle,
    lineHeight: 18,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    color: appColors.textPrimary,
  },
  textInput: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceMuted,
    paddingHorizontal: 14,
    fontSize: 15,
    color: appColors.textPrimary,
  },
  textArea: {
    minHeight: 130,
    paddingTop: 12,
    paddingBottom: 12,
  },
  textInputFocused: {
    borderColor: appColors.primary,
    backgroundColor: appColors.surface,
  },
  textInputError: {
    borderColor: appColors.danger,
    backgroundColor: "#FFF7F8",
  },
  helperText: {
    marginTop: 7,
    fontSize: 12,
    color: appColors.textSubtle,
    lineHeight: 17,
  },
  errorText: {
    marginTop: 7,
    fontSize: 12,
    color: appColors.danger,
    lineHeight: 17,
    fontWeight: "600",
  },
  priceField: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceMuted,
    paddingHorizontal: 12,
  },
  currencyBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appColors.primarySoft,
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
  },
  currencyBadgeText: {
    fontSize: 17,
    fontWeight: "700",
    color: appColors.primary,
  },
  priceInput: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: "700",
    color: appColors.textPrimary,
  },
  chipRow: {
    paddingVertical: 2,
    paddingRight: 12,
  },
  categoryChip: {
    minHeight: 38,
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appColors.primaryBorderStrong,
    backgroundColor: appColors.surfaceSoftAlt,
    justifyContent: "center",
    marginRight: 8,
  },
  categoryChipActive: {
    borderColor: appColors.primary,
    backgroundColor: appColors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: appColors.textMuted,
  },
  categoryChipTextActive: {
    color: appColors.textOnPrimary,
  },
  photoUploadCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: appColors.primaryBorderStrong,
    backgroundColor: appColors.primarySoftAlt,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 20,
    minHeight: 150,
  },
  photoUploadCardFilled: {
    borderStyle: "solid",
    backgroundColor: appColors.surfaceSoft,
    borderColor: appColors.primaryBorder,
  },
  photoUploadCardError: {
    borderColor: appColors.danger,
    backgroundColor: "#FFF7F8",
  },
  photoUploadCardBusy: {
    opacity: 0.85,
  },
  photoUploadIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
    marginBottom: 10,
  },
  photoUploadTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: appColors.textPrimary,
  },
  photoUploadSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: appColors.textSecondary,
    textAlign: "center",
  },
  videoUploadRow: {
    marginTop: 10,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appColors.primaryBorder,
    backgroundColor: appColors.surfaceSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  videoUploadRowActive: {
    backgroundColor: appColors.primarySoft,
  },
  videoUploadText: {
    fontSize: 13,
    fontWeight: "600",
    color: appColors.primary,
  },
  previewRow: {
    marginTop: 12,
    paddingBottom: 4,
    paddingRight: 4,
    gap: 10,
  },
  previewTile: {
    width: 110,
    height: 82,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: appColors.borderSoft,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewRemoveButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  videoList: {
    marginTop: 10,
    gap: 8,
  },
  videoListItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    borderRadius: 10,
    backgroundColor: appColors.surfaceSoftAlt,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  videoListText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: appColors.textMuted,
    fontWeight: "600",
  },
  mediaRemoveButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
  },
  locationRow: {
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  locationRowActive: {
    borderColor: appColors.primaryBorder,
    backgroundColor: appColors.primarySoftAlt,
  },
  locationIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    marginRight: 10,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: appColors.textPrimary,
  },
  locationSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: appColors.textMuted,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 15,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appColors.primary,
  },
  submitButtonDisabled: {
    backgroundColor: appColors.primaryDisabled,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: appColors.textOnPrimary,
  },
  submitCaption: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
    color: appColors.textSubtle,
    marginBottom: 14,
  },
  pressed: {
    opacity: 0.84,
  },
});
