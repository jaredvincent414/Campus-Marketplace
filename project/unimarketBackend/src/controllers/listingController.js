const Listing = require("../models/Listing");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const { buildMediaUrl, uploadBufferToMediaStorage } = require("../utils/mediaStorage");
const { sendNotificationToUsers } = require("../services/pushNotificationService");
/**
 * Applies the listing CRUD operations
 * @param {*} req 
 * @param {*} res 
 */

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const isHttpUrl = (value = "") => {
    try {
        const parsed = new URL(String(value).trim());
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
};

const sanitizeMedia = (media) => {
    if (!Array.isArray(media)) return [];

    return media
        .map((item) => ({
            type: item?.type === "video" ? "video" : "image",
            url: String(item?.url || "").trim()
        }))
        .filter((item) => item.url && isHttpUrl(item.url));
};

const getListingStatusPushBody = (listing) => {
    const status = String(listing?.status || "available").toLowerCase();
    const title = String(listing?.title || "Your listing").trim();

    if (status === "sold") {
        return `"${title}" was marked as sold.`;
    }
    if (status === "pending") {
        return `"${title}" is now pending.`;
    }
    if (status === "deleted") {
        return `"${title}" is no longer available.`;
    }
    return `"${title}" was updated.`;
};

const syncListingStatusToConversations = async (req, listing, options = {}) => {
    await Conversation.updateMany(
        { listingId: listing._id },
        { $set: { "listingSnapshot.status": listing.status } }
    );

    const io = req.app.get("io");

    const relatedConversations = await Conversation.find({ listingId: listing._id })
        .select("buyerEmail sellerEmail")
        .lean();
    const conversationRecipients = Array.from(
        new Set(
            relatedConversations.flatMap((conversation) => [
                normalizeEmail(conversation.buyerEmail),
                normalizeEmail(conversation.sellerEmail),
            ])
        )
    ).filter(Boolean);

    if (io) {
        conversationRecipients.forEach((email) => {
            io.to(`user:${email}`).emit("inbox:refresh", {
                listingId: String(listing._id),
                status: listing.status,
            });
        });
        io.emit("listing:status", {
            listingId: String(listing._id),
            status: listing.status,
        });
    }

    const usersWhoSavedListing = await User.find({ savedListingIds: listing._id })
        .select("email")
        .lean();
    const actorEmail = normalizeEmail(options?.actorEmail);
    const pushRecipients = new Set(
        [
            ...conversationRecipients,
            normalizeEmail(listing.userEmail),
            normalizeEmail(listing.buyerEmail),
            ...usersWhoSavedListing.map((user) => normalizeEmail(user.email)),
        ].filter(Boolean)
    );
    if (actorEmail) {
        pushRecipients.delete(actorEmail);
    }

    if (pushRecipients.size > 0) {
        void sendNotificationToUsers({
            emails: Array.from(pushRecipients),
            preferenceKey: "listingUpdates",
            title: "Listing updated",
            body: getListingStatusPushBody(listing),
            data: {
                type: "listing_update",
                listingId: String(listing._id),
                status: String(listing.status || ""),
            },
        }).catch((notificationError) => {
            console.warn(
                "[notifications] Failed to send listing update notification:",
                notificationError instanceof Error ? notificationError.message : String(notificationError)
            );
        });
    }
};

// GET /api/listings (all listings)
const getListings = async (req, res) => {
    try {
        const listings = await Listing.find({ status: { $in: ["available", "pending"] } }).sort({ createdAt: -1 });
        res.json(listings);
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// GET /api/listings/user/:email (listings by user email)
const getListingsByUser = async (req, res) => {
    try {
        const { email } = req.params;
        const normalizedEmail = normalizeEmail(email);
        const listings = await Listing.find({
            userEmail: new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i"),
            status: { $in: ["available", "pending"] },
        }).sort({ createdAt: -1 });
        res.json(listings);
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// GET /api/listings/:id
const getListingById = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }
        res.json(listing);
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// POST /api/listings
const createListing = async (req, res) => {
    try {
        const { title, description, price, category, userEmail, imageUrl, media } = req.body;

        if (!title || !description || price === undefined || !userEmail) {
            return res.status(400).json({ message: "title, description, price, and userEmail are required" });
        }

        const normalizedMedia = sanitizeMedia(media);
        const sanitizedImageUrl = isHttpUrl(imageUrl) ? String(imageUrl).trim() : "";
        const imageFromMedia = normalizedMedia.find((item) => item.type === "image")?.url;
        const primaryImageUrl = sanitizedImageUrl || imageFromMedia;
        if (!primaryImageUrl) {
            return res.status(400).json({ message: "At least one image is required" });
        }

        const listing = new Listing({
            title,
            description,
            price,
            category,
            userEmail,
            imageUrl: primaryImageUrl || undefined,
            media: normalizedMedia,
            status: "available",
        });
        const created = await listing.save();
        res.status(201).json(created);
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// POST /api/listings/upload
const uploadListingMedia = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Media file is required" });
        }

        const mediaType = String(req.file.mimetype || "").startsWith("video/") ? "video" : "image";
        const mediaId = await uploadBufferToMediaStorage({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalName: req.file.originalname,
            metadata: {
                domain: "listing",
                mediaType,
            },
        });
        const mediaUrl = buildMediaUrl(req, mediaId);
        return res.status(201).json({ url: mediaUrl, type: mediaType });
    } catch (err) {
        return res.status(500).json({ message: err.message || "Media upload failed" });
    }
};

// POST /api/listings/:id/purchase
const purchaseListing = async (req, res) => {
    try {
        const { buyerEmail } = req.body;
        const normalizedBuyerEmail = normalizeEmail(buyerEmail);
        if (!normalizedBuyerEmail) {
            return res.status(400).json({ message: "buyerEmail is required" });
        }

        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (normalizeEmail(listing.userEmail) === normalizedBuyerEmail) {
            return res.status(403).json({ message: "You cannot buy your own listing" });
        }

        if (listing.status === "sold") {
            return res.status(400).json({ message: "This listing is already sold" });
        }

        listing.status = "sold";
        listing.buyerEmail = normalizedBuyerEmail;
        listing.purchasedAt = new Date();
        await listing.save();
        await syncListingStatusToConversations(req, listing, { actorEmail: normalizedBuyerEmail });
        res.json({ message: "Purchase successful" });
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// POST /api/listings/:id/mark-pending
const markListingPending = async (req, res) => {
    try {
        const { userEmail } = req.body;
        if (!userEmail) {
            return res.status(400).json({ message: "userEmail is required" });
        }

        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (normalizeEmail(listing.userEmail) !== normalizeEmail(userEmail)) {
            return res.status(403).json({ message: "Only the seller can update this listing" });
        }

        listing.status = "pending";
        listing.buyerEmail = undefined;
        listing.purchasedAt = undefined;
        await listing.save();
        await syncListingStatusToConversations(req, listing, { actorEmail: normalizeEmail(userEmail) });
        res.json(listing);
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// POST /api/listings/:id/mark-sold
const markListingSold = async (req, res) => {
    try {
        const { userEmail } = req.body;
        if (!userEmail) {
            return res.status(400).json({ message: "userEmail is required" });
        }

        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (normalizeEmail(listing.userEmail) !== normalizeEmail(userEmail)) {
            return res.status(403).json({ message: "Only the seller can update this listing" });
        }

        listing.status = "sold";
        listing.buyerEmail = undefined;
        listing.purchasedAt = undefined;
        await listing.save();
        await syncListingStatusToConversations(req, listing, { actorEmail: normalizeEmail(userEmail) });
        res.json(listing);
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// PUT /api/listings/:id
const updateListing = async (req, res) => {
    try {
        const updated = await Listing.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!updated) {
            return res.status(404).json({ message: "Listing not found" });
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// DELETE /api/listings/:id
const deleteListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        listing.status = "deleted";
        await listing.save();
        await User.updateMany({}, { $pull: { savedListingIds: listing._id } });
        await syncListingStatusToConversations(req, listing, { actorEmail: normalizeEmail(listing.userEmail) });
        res.json({ message: "Listing deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error" });
    }
};

module.exports = {
    getListings,
    getListingsByUser,
    getListingById,
    createListing,
    uploadListingMedia,
    purchaseListing,
    markListingPending,
    markListingSold,
    updateListing,
    deleteListing
};
