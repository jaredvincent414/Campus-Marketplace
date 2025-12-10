const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        category: { type: String, default: "General", trim: true },
        userEmail: { type: String, required: true, trim: true }
    },
    { timestamps: true }
);

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;

