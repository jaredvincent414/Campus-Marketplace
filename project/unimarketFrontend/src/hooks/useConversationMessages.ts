import { useCallback, useEffect, useState } from "react";
import { Message } from "../types";
import { fetchConversationMessages } from "../services/api";

export const useConversationMessages = (conversationId?: string, userEmail?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async () => {
    if (!conversationId || !userEmail) {
      setMessages([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchConversationMessages(conversationId, userEmail);
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, userEmail]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return {
    messages,
    setMessages,
    isLoading,
    error,
    refresh: loadMessages,
  };
};
