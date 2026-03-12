import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { MessageDeliveryStatus } from "../../types";
import { appColors } from "../../theme/colors";

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
    backgroundColor: appColors.primary,
    borderBottomRightRadius: 6,
  },
  bubbleOther: {
    backgroundColor: appColors.surfaceSoft,
    borderBottomLeftRadius: 6,
  },
  body: {
    fontSize: 15,
    lineHeight: 20,
  },
  bodyMine: {
    color: appColors.textOnPrimary,
  },
  bodyOther: {
    color: appColors.textPrimary,
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
    color: appColors.textPlaceholder,
  },
  retry: {
    fontSize: 11,
    color: appColors.danger,
    fontWeight: "700",
  },
});
