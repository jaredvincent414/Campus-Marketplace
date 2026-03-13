import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { registerPushTokenForUser } from "../services/api";
import {
  getExpoPushToken,
  getNotificationPlatform,
  hasNotificationPermission,
  NotificationNavigationData,
  requestNotificationPermission,
} from "../services/notifications";

const normalizeEmail = (email = "") => String(email || "").trim().toLowerCase();
const getPromptKey = (email: string) => `unimarket_notifications_prompted_${normalizeEmail(email)}`;

const promptNotificationOptIn = () =>
  new Promise<boolean>((resolve) => {
    let settled = false;
    const done = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    Alert.alert(
      "Stay in the loop",
      "Turn on notifications to know when buyers or sellers message you.",
      [
        { text: "Enable", onPress: () => done(true) },
        { text: "Not now", style: "cancel", onPress: () => done(false) },
      ],
      { cancelable: true, onDismiss: () => done(false) }
    );
  });

const navigateFromNotificationData = (
  router: ReturnType<typeof useRouter>,
  data: NotificationNavigationData
) => {
  const type = String(data?.type || "").trim().toLowerCase();
  const conversationId = String(data?.conversationId || "").trim();
  const listingId = String(data?.listingId || "").trim();

  if (type === "message" && conversationId) {
    router.push({
      pathname: "/(tabs)/(messages)/[conversationId]",
      params: { conversationId },
    });
    return;
  }

  if (type === "listing_update" && listingId) {
    router.push({
      pathname: "/(tabs)/(market)",
      params: { listingId },
    });
    return;
  }

  if (type === "message") {
    router.push("/(tabs)/(messages)");
  }
};

export const usePushNotifications = (userEmail?: string) => {
  const router = useRouter();
  const lastHandledNotificationIdRef = useRef<string>("");

  useEffect(() => {
    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      // Foreground handling is managed by messaging/listing sockets; we keep this listener for future UX hooks.
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const responseId = String(response.notification.request.identifier || "").trim();
      if (responseId && lastHandledNotificationIdRef.current === responseId) return;
      lastHandledNotificationIdRef.current = responseId;

      navigateFromNotificationData(
        router,
        response.notification.request.content.data as NotificationNavigationData
      );
    });

    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        const responseId = String(response.notification.request.identifier || "").trim();
        if (responseId && lastHandledNotificationIdRef.current === responseId) return;
        lastHandledNotificationIdRef.current = responseId;
        navigateFromNotificationData(
          router,
          response.notification.request.content.data as NotificationNavigationData
        );
      })
      .catch(() => {
        // best-effort only
      });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [router]);

  useEffect(() => {
    const normalizedEmail = normalizeEmail(userEmail);
    if (!normalizedEmail) return;

    let active = true;

    const registerToken = async () => {
      const token = await getExpoPushToken();
      if (!active || !token) return;

      await registerPushTokenForUser(normalizedEmail, {
        token,
        platform: getNotificationPlatform(),
        provider: "expo",
      });
    };

    const bootstrapRegistration = async () => {
      const [hasPermission, prompted] = await Promise.all([
        hasNotificationPermission(),
        AsyncStorage.getItem(getPromptKey(normalizedEmail)),
      ]);

      if (hasPermission) {
        await registerToken();
        return;
      }

      if (prompted) {
        return;
      }

      const shouldPrompt = await promptNotificationOptIn();
      if (!active) return;
      await AsyncStorage.setItem(getPromptKey(normalizedEmail), "1");

      if (!shouldPrompt) return;
      const granted = await requestNotificationPermission();
      if (!granted || !active) return;
      await registerToken();
    };

    const pushTokenSubscription = Notifications.addPushTokenListener(({ data }) => {
      const token = String(data || "").trim();
      if (!token) return;

      registerPushTokenForUser(normalizedEmail, {
        token,
        platform: getNotificationPlatform(),
        provider: "expo",
      }).catch(() => {
        // best-effort only
      });
    });

    bootstrapRegistration().catch(() => {
      // best-effort only
    });

    return () => {
      active = false;
      pushTokenSubscription.remove();
    };
  }, [userEmail]);
};

