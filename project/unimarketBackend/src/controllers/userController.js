const User = require("../models/User");
const Listing = require("../models/Listing");
const mongoose = require("mongoose");
const { buildMediaUrl, deleteMediaByUrl, uploadBufferToMediaStorage } = require("../utils/mediaStorage");
const { isValidCampusEmail, normalizeEmail } = require("../utils/emailValidation");
const {
  DEFAULT_NOTIFICATION_PREFERENCES,
  isExpoPushToken,
} = require("../services/pushNotificationService");

const isHttpUrl = (value = "") => {
  try {
    const parsed = new URL(String(value).trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizeNotificationPreferences = (input = {}) => ({
  ...DEFAULT_NOTIFICATION_PREFERENCES,
  ...(input || {}),
});

const applyNotificationPreferenceUpdates = (existing = {}, incoming = {}) => {
  const next = normalizeNotificationPreferences(existing);
  const allowedKeys = Object.keys(DEFAULT_NOTIFICATION_PREFERENCES);
  let changed = false;

  allowedKeys.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(incoming, key)) return;
    next[key] = Boolean(incoming[key]);
    changed = true;
  });

  return { next, changed };
};

const normalizeUserPayload = (user) => {
  const plain = user?.toObject ? user.toObject() : user;
  const { pushTokens, ...safePlain } = plain || {};
  return {
    ...safePlain,
    savedListingIds: Array.isArray(safePlain?.savedListingIds)
      ? safePlain.savedListingIds.map((id) => String(id))
      : [],
    notificationPreferences: normalizeNotificationPreferences(safePlain?.notificationPreferences),
  };
};

const withPurchasesCount = async (payload) => {
  const normalizedEmail = normalizeEmail(payload?.email);
  if (!normalizedEmail) {
    return { ...payload, purchasesCount: 0 };
  }

  const purchasesCount = await Listing.countDocuments({
    buyerEmail: normalizedEmail,
    status: "sold",
  });

  return {
    ...payload,
    purchasesCount,
  };
};

// Create or update a user by email (no external dependency)
const createOrUpdateUser = async (req, res, next) => {
  try {
    const { name, email, profileImageUrl } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!name || !normalizedEmail) {
      return res.status(400).json({ message: "Name and email are required" });
    }
    if (!isValidCampusEmail(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid Brandeis email address ending in @brandeis.edu.",
      });
    }

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      user.name = String(name).trim();
      if (profileImageUrl !== undefined) {
        const photo = String(profileImageUrl || "").trim();
        if (photo && !isHttpUrl(photo)) {
          return res.status(400).json({ message: "profileImageUrl must be a valid URL" });
        }
        user.profileImageUrl = photo;
      }
      await user.save();
      return res.json(await withPurchasesCount(normalizeUserPayload(user)));
    }

    const nextPhoto = String(profileImageUrl || "").trim();
    if (nextPhoto && !isHttpUrl(nextPhoto)) {
      return res.status(400).json({ message: "profileImageUrl must be a valid URL" });
    }

    user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      profileImageUrl: nextPhoto,
      savedListingIds: [],
      notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
    });
    return res.status(201).json(await withPurchasesCount(normalizeUserPayload(user)));
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:email/push-token
const upsertUserPushToken = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.params.email);
    const token = String(req.body?.token || "").trim();
    const platform = String(req.body?.platform || "ios").trim().toLowerCase();
    const provider = String(req.body?.provider || "expo").trim().toLowerCase();
    const deviceId = String(req.body?.deviceId || "").trim() || null;

    if (!normalizedEmail || !token) {
      return res.status(400).json({ message: "Email and token are required" });
    }
    if (!isExpoPushToken(token)) {
      return res.status(400).json({ message: "Invalid Expo push token" });
    }
    if (provider !== "expo") {
      return res.status(400).json({ message: "Only provider 'expo' is currently supported" });
    }
    if (!["ios", "android", "web"].includes(platform)) {
      return res.status(400).json({ message: "platform must be ios, android, or web" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    const existing = (user.pushTokens || []).find((entry) => entry.token === token);
    if (existing) {
      existing.provider = "expo";
      existing.platform = platform;
      existing.deviceId = deviceId;
      existing.isActive = true;
      existing.updatedAt = now;
    } else {
      user.pushTokens.push({
        token,
        provider: "expo",
        platform,
        deviceId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    await user.save();
    return res.json(await withPurchasesCount(normalizeUserPayload(user)));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:email/push-token
const deactivateUserPushToken = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.params.email);
    const token = String(req.body?.token || "").trim();

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    if (token) {
      (user.pushTokens || []).forEach((entry) => {
        if (entry.token === token) {
          entry.isActive = false;
          entry.updatedAt = now;
        }
      });
    } else {
      (user.pushTokens || []).forEach((entry) => {
        entry.isActive = false;
        entry.updatedAt = now;
      });
    }

    await user.save();
    return res.json(await withPurchasesCount(normalizeUserPayload(user)));
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:email/notification-preferences
const updateNotificationPreferences = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.params.email);
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { next, changed } = applyNotificationPreferenceUpdates(
      user.notificationPreferences,
      req.body || {}
    );
    if (!changed) {
      return res.status(400).json({
        message: "Provide at least one notification preference to update",
      });
    }

    user.notificationPreferences = next;
    await user.save();
    return res.json(await withPurchasesCount(normalizeUserPayload(user)));
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:email
const getUserByEmail = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.params.email);
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(await withPurchasesCount(normalizeUserPayload(user)));
  } catch (err) {
    next(err);
  }
};

// POST /api/users/upload-photo
const uploadUserProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Profile photo is required" });
    }

    if (!String(req.file.mimetype || "").startsWith("image/")) {
      return res.status(400).json({ message: "Only image files are allowed for profile photos" });
    }

    const mediaId = await uploadBufferToMediaStorage({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      metadata: {
        domain: "profile",
      },
    });
    const mediaUrl = buildMediaUrl(req, mediaId);
    return res.status(201).json({ url: mediaUrl });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/users/:email/profile-photo
const updateUserProfilePhoto = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.params.email);
    const profileImageUrl = String(req.body?.profileImageUrl || "").trim();
    if (!normalizedEmail || !profileImageUrl) {
      return res.status(400).json({ message: "Email and profileImageUrl are required" });
    }
    if (!isHttpUrl(profileImageUrl)) {
      return res.status(400).json({ message: "profileImageUrl must be a valid URL" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const previousPhotoUrl = String(user.profileImageUrl || "").trim();
    user.profileImageUrl = profileImageUrl;
    await user.save();
    if (previousPhotoUrl && previousPhotoUrl !== profileImageUrl) {
      await deleteMediaByUrl(previousPhotoUrl);
    }
    return res.json(await withPurchasesCount(normalizeUserPayload(user)));
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:email/saved-listings
const getSavedListings = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.params.email);
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("savedListingIds");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const savedListingIds = Array.isArray(user.savedListingIds) ? user.savedListingIds : [];
    if (savedListingIds.length === 0) {
      return res.json([]);
    }

    const listings = await Listing.find({
      _id: { $in: savedListingIds },
      status: { $ne: "deleted" },
    }).sort({ createdAt: -1 });

    return res.json(listings);
  } catch (err) {
    next(err);
  }
};

// POST /api/users/:email/saved-listings/:listingId
const saveListingForUser = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.params.email);
    const { listingId } = req.params;
    if (!normalizedEmail || !listingId) {
      return res.status(400).json({ message: "Email and listingId are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "Invalid listingId" });
    }

    const [user, listing] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      Listing.findById(listingId).select("_id status"),
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!listing || listing.status === "deleted") {
      return res.status(404).json({ message: "Listing not found" });
    }

    await User.updateOne(
      { _id: user._id },
      { $addToSet: { savedListingIds: listing._id } }
    );
    const updatedUser = await User.findById(user._id);
    return res.json(await withPurchasesCount(normalizeUserPayload(updatedUser)));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:email/saved-listings/:listingId
const removeSavedListingForUser = async (req, res, next) => {
  try {
    const normalizedEmail = normalizeEmail(req.params.email);
    const { listingId } = req.params;
    if (!normalizedEmail || !listingId) {
      return res.status(400).json({ message: "Email and listingId are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "Invalid listingId" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.updateOne(
      { _id: user._id },
      { $pull: { savedListingIds: listingId } }
    );
    const updatedUser = await User.findById(user._id);
    return res.json(await withPurchasesCount(normalizeUserPayload(updatedUser)));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrUpdateUser,
  getUserByEmail,
  upsertUserPushToken,
  deactivateUserPushToken,
  updateNotificationPreferences,
  uploadUserProfilePhoto,
  updateUserProfilePhoto,
  getSavedListings,
  saveListingForUser,
  removeSavedListingForUser,
};
