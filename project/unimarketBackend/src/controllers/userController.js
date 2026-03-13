const User = require("../models/User");
const Listing = require("../models/Listing");
const mongoose = require("mongoose");

const normalizeEmail = (value = "") => String(value).trim().toLowerCase();
const isHttpUrl = (value = "") => {
  try {
    const parsed = new URL(String(value).trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizeUserPayload = (user) => {
  const plain = user?.toObject ? user.toObject() : user;
  return {
    ...plain,
    savedListingIds: Array.isArray(plain?.savedListingIds)
      ? plain.savedListingIds.map((id) => String(id))
      : [],
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
      return res.json(normalizeUserPayload(user));
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
    });
    return res.status(201).json(normalizeUserPayload(user));
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

    return res.json(normalizeUserPayload(user));
  } catch (err) {
    next(err);
  }
};

// POST /api/users/upload-photo
const uploadUserProfilePhoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Profile photo is required" });
  }

  if (!String(req.file.mimetype || "").startsWith("image/")) {
    return res.status(400).json({ message: "Only image files are allowed for profile photos" });
  }

  const mediaUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  return res.status(201).json({ url: mediaUrl });
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

    user.profileImageUrl = profileImageUrl;
    await user.save();
    return res.json(normalizeUserPayload(user));
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
    return res.json(normalizeUserPayload(updatedUser));
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
    return res.json(normalizeUserPayload(updatedUser));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrUpdateUser,
  getUserByEmail,
  uploadUserProfilePhoto,
  updateUserProfilePhoto,
  getSavedListings,
  saveListingForUser,
  removeSavedListingForUser,
};
