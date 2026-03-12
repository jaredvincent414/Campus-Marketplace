import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../../../src/contexts/UserContext";
import { Conversation, Message } from "../../../src/types";
import {
  fetchConversationById,
  markListingPending,
  markListingSold,
  markConversationRead,
  sendConversationMessage,
} from "../../../src/services/api";
import { getOrCreateMessagingSocket } from "../../../src/services/socket";
import { useConversationMessages } from "../../../src/hooks/useConversationMessages";
import { ListingContextCard } from "../../../src/components/messages/ListingContextCard";
import { MessageBubble } from "../../../src/components/messages/MessageBubble";
import { MessageComposer } from "../../../src/components/messages/MessageComposer";

const formatMessageTime = (rawDate: string) => {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export default function ConversationScreen() {
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { user } = useUser();
  const listRef = useRef<FlatList<Message>>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingListingStatus, setIsUpdatingListingStatus] = useState(false);

  const {
    messages,
    setMessages,
    isLoading: messagesLoading,
    error: messagesError,
    refresh: refreshMessages,
  } = useConversationMessages(conversationId, user?.email);

  const refreshConversation = useCallback(async () => {
    if (!conversationId || !user?.email) return;
    try {
      setConversationLoading(true);
      setConversationError(null);
      const detail = await fetchConversationById(conversationId, user.email);
      setConversation(detail);
    } catch (err) {
      setConversationError(err instanceof Error ? err.message : "Failed to load conversation");
    } finally {
      setConversationLoading(false);
    }
  }, [conversationId, user?.email]);

  useFocusEffect(
    useCallback(() => {
      refreshConversation();
      refreshMessages();
      if (conversationId && user?.email) {
        markConversationRead(conversationId, user.email).catch(() => {
          // best-effort only
        });
      }
    }, [conversationId, user?.email, refreshConversation, refreshMessages])
  );

  useEffect(() => {
    if (!conversationId || !user?.email) return;
    const socket = getOrCreateMessagingSocket(user.email);
    const normalizedUserEmail = user.email.toLowerCase();
    const conversationKey = String(conversationId);

    const handleIncomingMessage = (incoming: Message) => {
      if (!incoming || incoming.conversationId !== conversationKey) return;
      setMessages((prev) => {
        const byId = new Map<string, Message>();
        [...prev, incoming].forEach((message) => {
          byId.set(message.id, message);
        });
        return Array.from(byId.values()).sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );
      });
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              lastMessage: incoming.body,
              lastMessageAt: incoming.sentAt,
            }
          : prev
      );
      if (incoming.senderEmail !== normalizedUserEmail) {
        markConversationRead(conversationKey, normalizedUserEmail).catch(() => {
          // best-effort only
        });
      }
    };

    const handleListingStatus = (payload: { listingId?: string; status?: Conversation["listing"]["status"] }) => {
      if (!payload?.listingId || !payload?.status) return;
      const nextStatus: Conversation["listing"]["status"] = payload.status;
      setConversation((prev) =>
        prev && prev.listing.id === payload.listingId
          ? {
              ...prev,
              listing: {
                ...prev.listing,
                status: nextStatus,
              },
            }
          : prev
      );
    };

    const handleInboxRefresh = (payload: { conversationId?: string }) => {
      if (!payload?.conversationId || payload.conversationId !== conversationKey) return;
      refreshConversation();
    };

    socket.emit("join-user", normalizedUserEmail);
    socket.emit("join-conversation", conversationKey);
    socket.on("message:new", handleIncomingMessage);
    socket.on("listing:status", handleListingStatus);
    socket.on("inbox:refresh", handleInboxRefresh);

    return () => {
      socket.emit("leave-conversation", conversationKey);
      socket.off("message:new", handleIncomingMessage);
      socket.off("listing:status", handleListingStatus);
      socket.off("inbox:refresh", handleInboxRefresh);
    };
  }, [conversationId, user?.email, refreshConversation, setMessages]);

  useEffect(() => {
    if (messages.length === 0) return;
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 40);
    return () => clearTimeout(timeout);
  }, [messages.length]);

  const quickReplies = useMemo(() => {
    const offer = conversation?.listing?.price
      ? `Can you do $${Math.max(1, Math.floor(conversation.listing.price * 0.9))}?`
      : "Can you do a better price?";
    return ["Is this still available?", "Can I pick this up today?", offer];
  }, [conversation?.listing?.price]);

  const sendText = async (rawBody: string) => {
    if (!conversationId || !user?.email) return;
    const body = rawBody.trim();
    if (!body) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId,
      senderEmail: user.email.toLowerCase(),
      body,
      sentAt: new Date().toISOString(),
      readAt: null,
      deliveryStatus: "sending",
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setDraft("");
    setIsSending(true);

    try {
      const saved = await sendConversationMessage(conversationId, user.email, body);
      setMessages((prev) => {
        const replaced = prev.map((message) => (message.id === tempId ? saved : message));
        const byId = new Map<string, Message>();
        replaced.forEach((message) => {
          byId.set(message.id, message);
        });
        return Array.from(byId.values()).sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );
      });
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              lastMessage: saved.body,
              lastMessageAt: saved.sentAt,
            }
          : prev
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send message";
      setMessages((prev) =>
        prev.map((message) =>
          message.id === tempId ? { ...message, deliveryStatus: "failed" } : message
        )
      );
      Alert.alert("Send failed", errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleRetryMessage = async (message: Message) => {
    setMessages((prev) =>
      prev.map((entry) =>
        entry.id === message.id ? { ...entry, deliveryStatus: "sending" } : entry
      )
    );
    try {
      const saved = await sendConversationMessage(conversationId, user?.email || "", message.body);
      setMessages((prev) => {
        const replaced = prev.map((entry) => (entry.id === message.id ? saved : entry));
        const byId = new Map<string, Message>();
        replaced.forEach((entry) => {
          byId.set(entry.id, entry);
        });
        return Array.from(byId.values()).sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        );
      });
    } catch {
      setMessages((prev) =>
        prev.map((entry) =>
          entry.id === message.id ? { ...entry, deliveryStatus: "failed" } : entry
        )
      );
    }
  };

  const handleUpdateListingStatus = async (nextStatus: "pending" | "sold") => {
    if (!conversation?.listing?.id || !user?.email) return;
    try {
      setIsUpdatingListingStatus(true);
      const updater = nextStatus === "pending" ? markListingPending : markListingSold;
      const updated = await updater(conversation.listing.id, user.email);
      setConversation((prev) =>
        prev
          ? {
              ...prev,
              listing: {
                ...prev.listing,
                status: (updated.status || nextStatus) as Conversation["listing"]["status"],
              },
            }
          : prev
      );
      Alert.alert("Listing updated", `Marked as ${nextStatus}.`);
    } catch (err) {
      Alert.alert("Update failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setIsUpdatingListingStatus(false);
    }
  };

  const title = conversation?.otherUser?.fullName || "Conversation";
  const subtitle = conversation?.otherUser?.email || "";
  const isSeller = Boolean(
    conversation?.sellerEmail &&
    user?.email &&
    conversation.sellerEmail === user.email.toLowerCase()
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 72 : 0}
      >
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#222222" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          <Pressable style={styles.headerButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#696969" />
          </Pressable>
        </View>

        <View style={styles.content}>
          {conversation?.listing ? (
            <View style={styles.contextWrap}>
              <ListingContextCard listing={conversation.listing} />
            </View>
          ) : null}

          {isSeller ? (
            <View style={styles.sellerActionsRow}>
              <Pressable
                style={[
                  styles.sellerActionButton,
                  conversation?.listing.status === "pending" && styles.sellerActionButtonActive,
                ]}
                onPress={() => handleUpdateListingStatus("pending")}
                disabled={isUpdatingListingStatus || conversation?.listing.status === "pending"}
              >
                <Text
                  style={[
                    styles.sellerActionText,
                    conversation?.listing.status === "pending" && styles.sellerActionTextActive,
                  ]}
                >
                  Mark Pending
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.sellerActionButton,
                  conversation?.listing.status === "sold" && styles.sellerActionButtonActiveSold,
                ]}
                onPress={() => handleUpdateListingStatus("sold")}
                disabled={isUpdatingListingStatus || conversation?.listing.status === "sold"}
              >
                <Text
                  style={[
                    styles.sellerActionText,
                    conversation?.listing.status === "sold" && styles.sellerActionTextActiveSold,
                  ]}
                >
                  Mark Sold
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.messagesWrap}>
            {conversationLoading || messagesLoading ? (
              <View style={styles.centerState}>
                <Text style={styles.centerStateText}>Loading conversation...</Text>
              </View>
            ) : null}

            {!conversationLoading && !messagesLoading && (conversationError || messagesError) ? (
              <View style={styles.centerState}>
                <Text style={styles.errorTitle}>Could not load this conversation</Text>
                <Text style={styles.errorBody}>{conversationError || messagesError}</Text>
                <Pressable
                  style={styles.retryButton}
                  onPress={() => {
                    refreshConversation();
                    refreshMessages();
                  }}
                >
                  <Text style={styles.retryButtonText}>Try again</Text>
                </Pressable>
              </View>
            ) : null}

            {!conversationLoading && !messagesLoading && !conversationError && !messagesError ? (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isMine = item.senderEmail === user?.email?.toLowerCase();
                  return (
                    <MessageBubble
                      body={item.body}
                      isMine={isMine}
                      timestamp={formatMessageTime(item.sentAt)}
                      status={item.deliveryStatus}
                      onRetry={item.deliveryStatus === "failed" ? () => handleRetryMessage(item) : undefined}
                    />
                  );
                }}
                contentContainerStyle={styles.messagesListContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.centerState}>
                    <Text style={styles.centerStateText}>No messages yet. Say hello to get started.</Text>
                  </View>
                }
              />
            ) : null}
          </View>

          <View style={styles.quickReplyRow}>
            {quickReplies.map((chip) => (
              <Pressable key={chip} style={styles.quickReplyChip} onPress={() => setDraft(chip)}>
                <Text style={styles.quickReplyText}>{chip}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.composerWrap}>
            <MessageComposer
              value={draft}
              onChangeText={setDraft}
              onSend={() => sendText(draft)}
              disabled={isSending || !conversation}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardWrap: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
    backgroundColor: "#FFFFFF",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#7A7A7A",
    marginTop: 1,
  },
  content: {
    flex: 1,
  },
  contextWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  sellerActionsRow: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: "row",
    gap: 8,
  },
  sellerActionButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    backgroundColor: "#FAFAFA",
    paddingVertical: 9,
    alignItems: "center",
  },
  sellerActionButtonActive: {
    borderColor: "#F6D4A9",
    backgroundColor: "#FFF6E9",
  },
  sellerActionButtonActiveSold: {
    borderColor: "#E3E3E3",
    backgroundColor: "#F2F2F2",
  },
  sellerActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3D3D3D",
  },
  sellerActionTextActive: {
    color: "#A86500",
  },
  sellerActionTextActiveSold: {
    color: "#555555",
  },
  messagesWrap: {
    flex: 1,
  },
  messagesListContent: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 18,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  centerStateText: {
    fontSize: 14,
    color: "#6B6B6B",
    textAlign: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
    textAlign: "center",
  },
  errorBody: {
    fontSize: 14,
    color: "#6A6A6A",
    textAlign: "center",
    marginBottom: 14,
  },
  retryButton: {
    borderRadius: 999,
    backgroundColor: "#FF385C",
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  quickReplyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  quickReplyChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E9E9E9",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickReplyText: {
    fontSize: 12,
    color: "#616161",
    fontWeight: "600",
  },
  composerWrap: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
  },
});
