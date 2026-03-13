const mongoose = require("mongoose");

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
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
