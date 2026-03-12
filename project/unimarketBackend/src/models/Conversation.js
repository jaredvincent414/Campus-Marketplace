const mongoose = require("mongoose");

const listingSnapshotSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    thumbnailUrl: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["available", "pending", "sold", "deleted"],
      default: "available",
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true },
    buyerEmail: { type: String, required: true, trim: true, lowercase: true },
    sellerEmail: { type: String, required: true, trim: true, lowercase: true },
    lastMessage: { type: String, trim: true, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    buyerUnreadCount: { type: Number, default: 0, min: 0 },
    sellerUnreadCount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["active", "archived", "blocked", "closed"],
      default: "active",
    },
    listingSnapshot: { type: listingSnapshotSchema, required: true },
  },
  { timestamps: true }
);

conversationSchema.index({ listingId: 1, buyerEmail: 1, sellerEmail: 1 }, { unique: true });
conversationSchema.index({ buyerEmail: 1, lastMessageAt: -1 });
conversationSchema.index({ sellerEmail: 1, lastMessageAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
