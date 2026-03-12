const Listing = require("../models/Listing");
/**
 * Applies the listing CRUD operations
 * @param {*} req 
 * @param {*} res 
 */

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
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

// GET /api/listings (all listings)
const getListings = async (req, res) => {
    try {
        const listings = await Listing.find().sort({ createdAt: -1 });
        res.json(listings);
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// GET /api/listings/user/:email (listings by user email)
const getListingsByUser = async (req, res) => {
    try {
        const { email } = req.params;  
        const listings = await Listing.find({ userEmail: email }).sort({ createdAt: -1 });
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
            media: normalizedMedia
        });
        const created = await listing.save();
        res.status(201).json(created);
    } catch (err) {
        res.status(500).json({ message: err.message || "Server error" });
    }
};

// POST /api/listings/upload
const uploadListingMedia = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Media file is required" });
    }

    const mediaUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const mediaType = String(req.file.mimetype || "").startsWith("video/") ? "video" : "image";
    res.status(201).json({ url: mediaUrl, type: mediaType });
};

// POST /api/listings/:id/purchase
const purchaseListing = async (req, res) => {
    try {
        const { buyerEmail } = req.body;
        if (!buyerEmail) {
            return res.status(400).json({ message: "buyerEmail is required" });
        }

        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found" });
        }

        if (normalizeEmail(listing.userEmail) === normalizeEmail(buyerEmail)) {
            return res.status(403).json({ message: "You cannot buy your own listing" });
        }

        await listing.deleteOne();
        res.json({ message: "Purchase successful" });
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

        await listing.deleteOne();
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
    updateListing,
    deleteListing
};
