import { useState } from "react";
import { Conversation } from "../types";
import { createOrOpenConversation } from "../services/api";

export const useCreateOrOpenConversation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openConversation = async (listingId: string, buyerEmail: string): Promise<Conversation> => {
    try {
      setIsLoading(true);
      setError(null);
      return await createOrOpenConversation(listingId, buyerEmail);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to open conversation";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { openConversation, isLoading, error };
};
