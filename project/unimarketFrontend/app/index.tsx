import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useUser } from "../src/contexts/UserContext";
import { appColors } from "../src/theme/colors";

export default function IndexRoute() {
  const { user, isHydrated } = useUser();

  if (!isHydrated) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={appColors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return <Redirect href="/(tabs)/(market)" />;
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: appColors.pageBackground,
  },
});
