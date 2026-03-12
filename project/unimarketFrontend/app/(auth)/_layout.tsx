import React from "react";
import { Stack, Redirect } from "expo-router";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { useUser } from "../../src/contexts/UserContext";

export default function AuthLayout() {
  const { user, isHydrated } = useUser();

  if (!isHydrated) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#2F54D7" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/(market)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="sign-in" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF3FF",
  },
});
