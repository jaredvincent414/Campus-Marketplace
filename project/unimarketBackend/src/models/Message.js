const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderEmail: { type: String, required: true, trim: true, lowercase: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    sentAt: { type: Date, default: Date.now },
    readAt: { type: Date, default: null },
    deliveryStatus: {
      type: String,
      enum: ["sent", "delivered"],
      default: "sent",
    },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, sentAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
