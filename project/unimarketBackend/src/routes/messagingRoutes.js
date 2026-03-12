const express = require("express");
const {
  getConversations,
  createOrOpenConversation,
  getConversationById,
  getConversationMessages,
  sendMessage,
  markConversationRead,
} = require("../controllers/messagingController");

const router = express.Router();

router.get("/", getConversations);
router.post("/", createOrOpenConversation);
router.get("/:id", getConversationById);
router.get("/:id/messages", getConversationMessages);
router.post("/:id/messages", sendMessage);
router.post("/:id/read", markConversationRead);

module.exports = router;
