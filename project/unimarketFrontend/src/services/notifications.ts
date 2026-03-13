import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

export type NotificationNavigationData = {
  type?: string;
  conversationId?: string;
  listingId?: string;
  status?: string;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const getNotificationProjectId = (): string | null => {
  const expoConfig = Constants.expoConfig as { extra?: { eas?: { projectId?: string } } } | null;
  const easConfig = Constants.easConfig as { projectId?: string } | null;
  const projectId = expoConfig?.extra?.eas?.projectId || easConfig?.projectId;
  return projectId ? String(projectId).trim() : null;
};

export const getNotificationPlatform = (): "ios" | "android" | "web" => {
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "web") return "web";
  return "ios";
};

export const hasNotificationPermission = async (): Promise<boolean> => {
  const permissions = await Notifications.getPermissionsAsync();
  if (permissions.granted) return true;
  return (
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  const existing = await hasNotificationPermission();
  if (existing) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  if (requested.granted) return true;
  return requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
};

export const getExpoPushToken = async (): Promise<string> => {
  const projectId = getNotificationProjectId();
  if (!projectId) {
    throw new Error(
      "Missing EAS projectId. Add extra.eas.projectId to app config before enabling push notifications."
    );
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  return String(tokenResponse?.data || "").trim();
};
