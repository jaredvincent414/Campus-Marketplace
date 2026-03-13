const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Listing = require("../models/Listing");
const User = require("../models/User");
const { sendNotificationToUsers } = require("../services/pushNotificationService");

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const truncatePreview = (value = "", max = 160) => {
  const text = String(value || "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
};

const toListingContext = (conversation) => {
  const listingRef = conversation.listingId;
  const listingSnapshot = conversation.listingSnapshot || {};
  const listingId =
    listingRef && typeof listingRef === "object" && listingRef._id
      ? String(listingRef._id)
      : String(listingRef || "");

  return {
    id: listingId,
    title: listingRef?.title || listingSnapshot.title || "Listing unavailable",
    price: Number.isFinite(listingRef?.price) ? listingRef.price : listingSnapshot.price || 0,
    thumbnailUrl: listingRef?.imageUrl || listingSnapshot.thumbnailUrl || "",
    status: listingRef?.status || listingSnapshot.status || "available",
  };
};

const getRole = (conversation, userEmail) => {
  if (conversation.buyerEmail === userEmail) return "buyer";
  if (conversation.sellerEmail === userEmail) return "seller";
  return null;
};

const loadUserNameMap = async (emails) => {
  if (emails.length === 0) return new Map();
  const users = await User.find({
    email: { $in: emails.map((email) => normalizeEmail(email)) },
  })
    .select("name email")
    .lean();
  return new Map(users.map((user) => [normalizeEmail(user.email), user.name]));
};

const formatConversation = (conversation, currentUserEmail, userNameMap) => {
  const role = getRole(conversation, currentUserEmail);
  const otherEmail = role === "buyer" ? conversation.sellerEmail : conversation.buyerEmail;
  const otherName =
    userNameMap.get(otherEmail) || otherEmail.split("@")[0] || "UniMarket user";

  return {
    id: String(conversation._id),
    listingId: toListingContext(conversation).id,
    buyerEmail: conversation.buyerEmail,
    sellerEmail: conversation.sellerEmail,
    lastMessage: conversation.lastMessage || "",
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt,
    buyerUnreadCount: conversation.buyerUnreadCount || 0,
    sellerUnreadCount: conversation.sellerUnreadCount || 0,
    unreadCount: role === "buyer" ? conversation.buyerUnreadCount || 0 : conversation.sellerUnreadCount || 0,
    status: conversation.status || "active",
    listing: toListingContext(conversation),
    otherUser: {
      email: otherEmail,
      fullName: otherName,
    },
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

const formatMessage = (message) => ({
  id: String(message._id),
  conversationId: String(message.conversationId),
  senderEmail: message.senderEmail,
  body: message.body,
  sentAt: message.sentAt,
  readAt: message.readAt || null,
  deliveryStatus: message.deliveryStatus || "sent",
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

const emitInboxRefresh = (io, emails, payload = {}) => {
  if (!io) return;
  const uniqueEmails = Array.from(new Set((emails || []).map((email) => normalizeEmail(email)).filter(Boolean)));
  uniqueEmails.forEach((email) => {
    io.to(`user:${email}`).emit("inbox:refresh", payload);
  });
};

// GET /api/conversations?userEmail=...
const getConversations = async (req, res) => {
  try {
    const userEmail = normalizeEmail(req.query.userEmail);
    if (!userEmail) {
      return res.status(400).json({ message: "userEmail is required" });
    }

    const conversations = await Conversation.find({
      $or: [{ buyerEmail: userEmail }, { sellerEmail: userEmail }],
    })
      .populate("listingId", "title price imageUrl status")
      .sort({ lastMessageAt: -1 })
      .lean();

    const otherEmails = Array.from(
      new Set(
        conversations.map((conversation) =>
          conversation.buyerEmail === userEmail ? conversation.sellerEmail : conversation.buyerEmail
        )
      )
    );
    const userNameMap = await loadUserNameMap(otherEmails);

    return res.json(
      conversations.map((conversation) => formatConversation(conversation, userEmail, userNameMap))
    );
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// POST /api/conversations
const createOrOpenConversation = async (req, res) => {
  try {
    const listingId = String(req.body.listingId || "").trim();
    const buyerEmail = normalizeEmail(req.body.buyerEmail);

    if (!listingId || !buyerEmail) {
      return res.status(400).json({ message: "listingId and buyerEmail are required" });
    }

    const listing = await Listing.findById(listingId).lean();
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (listing.status === "sold" || listing.status === "deleted") {
      return res.status(400).json({ message: "This listing is no longer available for messaging" });
    }

    const sellerEmail = normalizeEmail(listing.userEmail);
    if (sellerEmail === buyerEmail) {
      return res.status(403).json({ message: "You cannot message your own listing" });
    }

    const thumbnailFromMedia =
      Array.isArray(listing.media) && listing.media.find((item) => item.type === "image")?.url;
    const listingSnapshot = {
      title: listing.title,
      price: listing.price,
      thumbnailUrl: listing.imageUrl || thumbnailFromMedia || "",
      status: listing.status || "available",
    };

    let conversation = await Conversation.findOne({
      listingId,
      buyerEmail,
      sellerEmail,
    })
      .populate("listingId", "title price imageUrl status")
      .lean();
    let created = false;

    if (!conversation) {
      try {
        const newConversation = await Conversation.create({
          listingId,
          buyerEmail,
          sellerEmail,
          listingSnapshot,
          lastMessageAt: new Date(),
        });
        created = true;
        conversation = await Conversation.findById(newConversation._id)
          .populate("listingId", "title price imageUrl status")
          .lean();
      } catch (err) {
        if (err?.code === 11000) {
          conversation = await Conversation.findOne({
            listingId,
            buyerEmail,
            sellerEmail,
          })
            .populate("listingId", "title price imageUrl status")
            .lean();
        } else {
          throw err;
        }
      }
    }

    const otherEmail = conversation.buyerEmail === buyerEmail ? conversation.sellerEmail : conversation.buyerEmail;
    const userNameMap = await loadUserNameMap([otherEmail]);
    const io = req.app.get("io");
    emitInboxRefresh(io, [buyerEmail], { conversationId: String(conversation._id) });

    return res.status(created ? 201 : 200).json(formatConversation(conversation, buyerEmail, userNameMap));
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// GET /api/conversations/:id?userEmail=...
const getConversationById = async (req, res) => {
  try {
    const userEmail = normalizeEmail(req.query.userEmail);
    if (!userEmail) {
      return res.status(400).json({ message: "userEmail is required" });
    }

    const conversation = await Conversation.findById(req.params.id)
      .populate("listingId", "title price imageUrl status")
      .lean();

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const role = getRole(conversation, userEmail);
    if (!role) {
      return res.status(403).json({ message: "Not authorized for this conversation" });
    }

    const otherEmail = role === "buyer" ? conversation.sellerEmail : conversation.buyerEmail;
    const userNameMap = await loadUserNameMap([otherEmail]);

    return res.json(formatConversation(conversation, userEmail, userNameMap));
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// GET /api/conversations/:id/messages?userEmail=...
const getConversationMessages = async (req, res) => {
  try {
    const userEmail = normalizeEmail(req.query.userEmail);
    if (!userEmail) {
      return res.status(400).json({ message: "userEmail is required" });
    }

    const conversation = await Conversation.findById(req.params.id)
      .select("buyerEmail sellerEmail")
      .lean();
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!getRole(conversation, userEmail)) {
      return res.status(403).json({ message: "Not authorized for this conversation" });
    }

    const messages = await Message.find({ conversationId: req.params.id })
      .sort({ sentAt: 1 })
      .lean();

    return res.json(messages.map(formatMessage));
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// POST /api/conversations/:id/messages
const sendMessage = async (req, res) => {
  try {
    const senderEmail = normalizeEmail(req.body.senderEmail);
    const body = String(req.body.body || "").trim();

    if (!senderEmail || !body) {
      return res.status(400).json({ message: "senderEmail and body are required" });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const role = getRole(conversation, senderEmail);
    if (!role) {
      return res.status(403).json({ message: "Not authorized for this conversation" });
    }
    if (conversation.status === "blocked" || conversation.status === "closed") {
      return res.status(403).json({ message: "This conversation is no longer active" });
    }

    const sentAt = new Date();
    const message = await Message.create({
      conversationId: conversation._id,
      senderEmail,
      body,
      sentAt,
      deliveryStatus: "delivered",
    });

    conversation.lastMessage = truncatePreview(body);
    conversation.lastMessageAt = sentAt;
    if (role === "buyer") {
      conversation.sellerUnreadCount += 1;
    } else {
      conversation.buyerUnreadCount += 1;
    }
    await conversation.save();

    const formattedMessage = formatMessage(message.toObject());
    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${String(conversation._id)}`).emit("message:new", formattedMessage);
      emitInboxRefresh(io, [conversation.buyerEmail, conversation.sellerEmail], {
        conversationId: String(conversation._id),
      });
    }

    const recipientEmail =
      role === "buyer" ? normalizeEmail(conversation.sellerEmail) : normalizeEmail(conversation.buyerEmail);
    const listingTitle = String(conversation?.listingSnapshot?.title || "a listing").trim();
    const sender = await User.findOne({ email: senderEmail }).select("name").lean();
    const senderName = String(sender?.name || senderEmail.split("@")[0] || "Someone").trim();

    if (recipientEmail && recipientEmail !== senderEmail) {
      void sendNotificationToUsers({
        emails: [recipientEmail],
        preferenceKey: "messages",
        title: "New message",
        body: `${senderName} messaged you about ${listingTitle}`,
        data: {
          type: "message",
          conversationId: String(conversation._id),
          listingId: String(conversation.listingId),
        },
      }).catch((notificationError) => {
        console.warn(
          "[notifications] Failed to send message notification:",
          notificationError instanceof Error ? notificationError.message : String(notificationError)
        );
      });
    }

    return res.status(201).json(formattedMessage);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

// POST /api/conversations/:id/read
const markConversationRead = async (req, res) => {
  try {
    const userEmail = normalizeEmail(req.body.userEmail);
    if (!userEmail) {
      return res.status(400).json({ message: "userEmail is required" });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const role = getRole(conversation, userEmail);
    if (!role) {
      return res.status(403).json({ message: "Not authorized for this conversation" });
    }

    if (role === "buyer") {
      conversation.buyerUnreadCount = 0;
    } else {
      conversation.sellerUnreadCount = 0;
    }

    await conversation.save();
    await Message.updateMany(
      {
        conversationId: conversation._id,
        senderEmail: { $ne: userEmail },
        readAt: null,
      },
      {
        $set: { readAt: new Date(), deliveryStatus: "delivered" },
      }
    );
    const io = req.app.get("io");
    emitInboxRefresh(io, [userEmail], { conversationId: String(conversation._id) });
    io
      ?.to(`conversation:${String(conversation._id)}`)
      .emit("conversation:read", { conversationId: String(conversation._id), userEmail });

    return res.json({ message: "Conversation marked as read" });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = {
  getConversations,
  createOrOpenConversation,
  getConversationById,
  getConversationMessages,
  sendMessage,
  markConversationRead,
};
