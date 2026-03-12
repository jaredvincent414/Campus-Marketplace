import { useMemo } from "react";
import { Conversation } from "../types";

export const useUnreadCount = (conversations: Conversation[]) =>
  useMemo(() => conversations.filter((conversation) => conversation.unreadCount > 0).length, [conversations]);
