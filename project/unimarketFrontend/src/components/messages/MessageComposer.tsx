import React from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
        placeholderTextColor="#A2A2A2"
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
        <Ionicons name="send" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderColor: "#E8E8E8",
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 24,
    maxHeight: 110,
    fontSize: 15,
    color: "#222222",
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FF385C",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#D2D2D2",
  },
});
