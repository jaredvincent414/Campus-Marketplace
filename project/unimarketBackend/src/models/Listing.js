const mongoose = require("mongoose");

const listingMediaSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["image", "video"],
            required: true
        },
        url: { type: String, required: true, trim: true }
    },
    { _id: false }
);

const listingSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        category: { type: String, default: "General", trim: true },
        userEmail: { type: String, required: true, trim: true },
        imageUrl: { type: String, trim: true },
        media: { type: [listingMediaSchema], default: [] }
    },
    { timestamps: true }
);

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
