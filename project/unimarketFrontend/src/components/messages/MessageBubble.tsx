import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MessageDeliveryStatus } from "../../types";

interface MessageBubbleProps {
  body: string;
  isMine: boolean;
  timestamp: string;
  status: MessageDeliveryStatus;
  onRetry?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  body,
  isMine,
  timestamp,
  status,
  onRetry,
}) => {
  const failed = status === "failed";
  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowOther]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.body, isMine ? styles.bodyMine : styles.bodyOther]}>{body}</Text>
      </View>
      <View style={[styles.metaRow, isMine ? styles.metaMine : styles.metaOther]}>
        <Text style={styles.timestamp}>{timestamp}</Text>
        {failed && onRetry ? (
          <Pressable onPress={onRetry}>
            <Text style={styles.retry}>Retry</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginBottom: 10,
    maxWidth: "85%",
  },
  rowMine: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  rowOther: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubbleMine: {
    backgroundColor: "#FF385C",
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: "#F1F1F1",
    borderBottomLeftRadius: 6,
  },
  body: {
    fontSize: 15,
    lineHeight: 20,
  },
  bodyMine: {
    color: "#FFFFFF",
  },
  bodyOther: {
    color: "#222222",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  metaMine: {
    justifyContent: "flex-end",
  },
  metaOther: {
    justifyContent: "flex-start",
  },
  timestamp: {
    fontSize: 11,
    color: "#8A8A8A",
  },
  retry: {
    fontSize: 11,
    color: "#D62839",
    fontWeight: "700",
  },
});
