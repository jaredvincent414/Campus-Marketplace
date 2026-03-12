import React from "react";
import { Pressable, View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Conversation } from "../../types";
import { UnreadBadge } from "./UnreadBadge";

interface ConversationRowProps {
  conversation: Conversation;
  onPress: () => void;
}

const formatTimestamp = (rawDate: string) => {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();
  if (isSameDay) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  const isSameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    ...(isSameYear ? {} : { year: "numeric" }),
  });
};

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  available: { bg: "#EBFFF1", color: "#1D7A38", label: "Available" },
  pending: { bg: "#FFF7E8", color: "#A86500", label: "Pending" },
  sold: { bg: "#F3F3F3", color: "#6A6A6A", label: "Sold" },
  deleted: { bg: "#F3F3F3", color: "#6A6A6A", label: "Unavailable" },
};

export const ConversationRow: React.FC<ConversationRowProps> = ({ conversation, onPress }) => {
  const lastMessage = conversation.lastMessage?.trim() || "Start the conversation";
  const timestamp = formatTimestamp(conversation.lastMessageAt);
  const hasUnread = conversation.unreadCount > 0;
  const statusMeta = statusStyles[conversation.listing?.status || "available"] || statusStyles.available;
  const name = conversation.otherUser?.fullName || conversation.otherUser?.email || "UniMarket user";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.avatarWrap}>
        <Text style={styles.avatarText}>{initials || "U"}</Text>
      </View>

      <View style={styles.mainBody}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, hasUnread && styles.nameUnread]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>

        <Text style={styles.listingTitle} numberOfLines={1}>
          {conversation.listing?.title || "Listing"}
        </Text>

        <View style={styles.previewRow}>
          <Text style={[styles.preview, hasUnread && styles.previewUnread]} numberOfLines={1}>
            {lastMessage}
          </Text>
          <UnreadBadge count={conversation.unreadCount} />
        </View>

        <View style={[styles.statusChip, { backgroundColor: statusMeta.bg }]}>
          <Text style={[styles.statusChipText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
        </View>
      </View>

      <View style={styles.thumbnailWrap}>
        {conversation.listing?.thumbnailUrl ? (
          <Image source={{ uri: conversation.listing.thumbnailUrl }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={styles.thumbnailFallback}>
            <Ionicons name="image-outline" size={15} color="#8A8A8A" />
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ECECEC",
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    opacity: 0.92,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF1F4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FF385C",
    fontSize: 14,
    fontWeight: "700",
  },
  mainBody: {
    flex: 1,
    paddingRight: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#222222",
    marginRight: 8,
  },
  nameUnread: {
    fontWeight: "700",
  },
  timestamp: {
    fontSize: 12,
    color: "#8A8A8A",
  },
  listingTitle: {
    fontSize: 13,
    color: "#4A4A4A",
    marginBottom: 6,
    fontWeight: "600",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  preview: {
    flex: 1,
    fontSize: 13,
    color: "#7A7A7A",
  },
  previewUnread: {
    color: "#3A3A3A",
    fontWeight: "600",
  },
  statusChip: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  thumbnailWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F6F6F6",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F6F6",
  },
});
