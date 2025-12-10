const Listing = require("../models/Listing");
/**
 * Applies the listing CRUD operations
 * @param {*} req 
 * @param {*} res 
 */

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
        const { title, description, price, category, userEmail } = req.body;

        if (!title || !description || price === undefined || !userEmail) {
            return res.status(400).json({ message: "title, description, price, and userEmail are required" });
        }

        const listing = new Listing({ title, description, price, category, userEmail });
        const created = await listing.save();
        res.status(201).json(created);
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

module.exports = {getListings,getListingsByUser,getListingById,createListing,updateListing,deleteListing};

