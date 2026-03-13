const mongoose = require("mongoose");

const pushTokenSchema = mongoose.Schema(
  {
    token: { type: String, required: true, trim: true },
    provider: { type: String, enum: ["expo"], default: "expo" },
    platform: { type: String, enum: ["ios", "android", "web"], default: "ios" },
    deviceId: { type: String, default: null, trim: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    profileImageUrl: { type: String, trim: true, default: "" },
    savedListingIds: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
      }],
      default: [],
    },
    pushTokens: {
      type: [pushTokenSchema],
      default: [],
    },
    notificationPreferences: {
      messages: { type: Boolean, default: true },
      listingUpdates: { type: Boolean, default: true },
      savedItemUpdates: { type: Boolean, default: false },
      system: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
