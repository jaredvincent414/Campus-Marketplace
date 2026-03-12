import React from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { appColors } from "../../theme/colors";

interface MessageComposerProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  value,
  onChangeText,
  onSend,
  disabled = false,
}) => {
  const canSend = !disabled && value.trim().length > 0;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        placeholderTextColor={appColors.textPlaceholder}
        value={value}
        onChangeText={onChangeText}
        multiline
        maxLength={2000}
      />
      <Pressable
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={!canSend}
      >
        <Ionicons name="send" size={16} color={appColors.textOnPrimary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderColor: appColors.borderSoft,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: appColors.surface,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 24,
    maxHeight: 110,
    fontSize: 15,
    color: appColors.textPrimary,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: appColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: appColors.primaryDisabled,
  },
});
