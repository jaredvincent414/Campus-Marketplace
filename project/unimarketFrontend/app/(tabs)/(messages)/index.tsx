import React, { useCallback } from "react";
import { SafeAreaView, View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../../../src/contexts/UserContext";
import { Conversation } from "../../../src/types";
import { useConversations } from "../../../src/hooks/useConversations";
import { useUnreadCount } from "../../../src/hooks/useUnreadCount";
import { ConversationRow } from "../../../src/components/messages/ConversationRow";
import { EmptyInboxState } from "../../../src/components/messages/EmptyInboxState";

export default function MessagesInboxScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { conversations, isLoading, error, refresh } = useConversations(user?.email);
  const unreadConversationCount = useUnreadCount(conversations);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const renderConversation = ({ item }: { item: Conversation }) => (
    <ConversationRow
      conversation={item}
      onPress={() =>
        router.push({
          pathname: "/(tabs)/(messages)/[conversationId]",
          params: { conversationId: item.id },
        })
      }
    />
  );

  const loadingState = (
    <View style={styles.centerState}>
      <Text style={styles.stateText}>Loading conversations...</Text>
    </View>
  );

  const errorState = (
    <View style={styles.centerState}>
      <Text style={styles.errorTitle}>Could not load messages</Text>
      <Text style={styles.errorBody}>{error || "Please try again."}</Text>
      <Pressable style={styles.retryButton} onPress={refresh}>
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
        <Text style={styles.retryText}>Retry</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>
            {unreadConversationCount > 0
              ? `${unreadConversationCount} unread ${unreadConversationCount === 1 ? "thread" : "threads"}`
              : "Stay in sync with buyers and sellers"}
          </Text>
        </View>
        <View style={styles.headerIconWrap}>
          <Ionicons name="chatbubbles-outline" size={20} color="#FF385C" />
        </View>
      </View>

      <View style={styles.content}>
        {isLoading ? loadingState : null}
        {!isLoading && error ? errorState : null}
        {!isLoading && !error ? (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversation}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<EmptyInboxState />}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#222222",
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#717171",
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF1F4",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 26,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  stateText: {
    fontSize: 15,
    color: "#6A6A6A",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 14,
    color: "#6A6A6A",
    textAlign: "center",
    marginBottom: 14,
  },
  retryButton: {
    backgroundColor: "#FF385C",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
