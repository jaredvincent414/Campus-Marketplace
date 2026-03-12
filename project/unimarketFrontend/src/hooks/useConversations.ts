import { useCallback, useEffect, useState } from "react";
import { Conversation } from "../types";
import { fetchConversations } from "../services/api";
import { getOrCreateMessagingSocket } from "../services/socket";

export const useConversations = (userEmail?: string) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!userEmail) {
      setConversations([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchConversations(userEmail);
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!userEmail) return;
    const socket = getOrCreateMessagingSocket(userEmail);
    const handleInboxRefresh = () => {
      loadConversations();
    };

    socket.emit("join-user", userEmail.toLowerCase());
    socket.on("inbox:refresh", handleInboxRefresh);

    return () => {
      socket.off("inbox:refresh", handleInboxRefresh);
    };
  }, [userEmail, loadConversations]);

  return {
    conversations,
    isLoading,
    error,
    refresh: loadConversations,
    setConversations,
  };
};
