const User = require("../models/User");

const EXPO_PUSH_SEND_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const DEFAULT_NOTIFICATION_PREFERENCES = {
  messages: true,
  listingUpdates: true,
  savedItemUpdates: false,
  system: true,
  marketing: false,
};

const normalizeEmail = (email = "") => String(email || "").trim().toLowerCase();
const normalizeToken = (token = "") => String(token || "").trim();
const isExpoPushToken = (token = "") =>
  /^Expo(nent)?PushToken\[[A-Za-z0-9-_.]+\]$/.test(normalizeToken(token));

const chunk = (items, size) => {
  const parts = [];
  for (let index = 0; index < items.length; index += size) {
    parts.push(items.slice(index, index + size));
  }
  return parts;
};

const collectActiveExpoTokens = async ({ emails, preferenceKey }) => {
  const normalizedEmails = Array.from(
    new Set((emails || []).map((email) => normalizeEmail(email)).filter(Boolean))
  );
  if (normalizedEmails.length === 0) return [];

  const users = await User.find({
    email: { $in: normalizedEmails },
    "pushTokens.isActive": true,
  })
    .select("email pushTokens notificationPreferences")
    .lean();

  return users.flatMap((user) => {
    const preferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(user?.notificationPreferences || {}),
    };
    if (preferenceKey && !preferences[preferenceKey]) {
      return [];
    }

    const userEmail = normalizeEmail(user?.email);
    const tokens = (Array.isArray(user?.pushTokens) ? user.pushTokens : [])
      .filter((entry) => entry?.isActive !== false && isExpoPushToken(entry?.token))
      .map((entry) => normalizeToken(entry.token));

    const uniqueTokens = Array.from(new Set(tokens));
    return uniqueTokens.map((token) => ({ userEmail, token }));
  });
};

const deactivateInvalidTokens = async (tokens) => {
  const uniqueTokens = Array.from(
    new Set((tokens || []).map((token) => normalizeToken(token)).filter(Boolean))
  );
  if (uniqueTokens.length === 0) return;

  const now = new Date();
  await User.updateMany(
    { "pushTokens.token": { $in: uniqueTokens } },
    {
      $set: {
        "pushTokens.$[entry].isActive": false,
        "pushTokens.$[entry].updatedAt": now,
      },
    },
    {
      arrayFilters: [{ "entry.token": { $in: uniqueTokens } }],
    }
  );
};

const sendExpoMessages = async (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { sent: 0, failed: 0, invalidTokens: [] };
  }
  if (typeof fetch !== "function") {
    console.warn("[notifications] Global fetch is unavailable; skipping push send.");
    return { sent: 0, failed: messages.length, invalidTokens: [] };
  }

  const batches = chunk(messages, 100);
  let sent = 0;
  let failed = 0;
  const invalidTokens = [];

  for (const batch of batches) {
    try {
      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      const accessToken = String(process.env.EXPO_ACCESS_TOKEN || "").trim();
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch(EXPO_PUSH_SEND_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        failed += batch.length;
        continue;
      }

      const payload = await response.json();
      const tickets = Array.isArray(payload?.data) ? payload.data : [];
      batch.forEach((message, index) => {
        const ticket = tickets[index];
        if (ticket?.status === "ok") {
          sent += 1;
          return;
        }

        failed += 1;
        if (ticket?.details?.error === "DeviceNotRegistered") {
          invalidTokens.push(message.to);
        }
      });
    } catch (error) {
      failed += batch.length;
      console.warn(
        "[notifications] Expo push send failed:",
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  return { sent, failed, invalidTokens };
};

const sendNotificationToUsers = async ({
  emails,
  preferenceKey,
  title,
  body,
  data = {},
  sound = "default",
}) => {
  const recipients = await collectActiveExpoTokens({ emails, preferenceKey });
  if (recipients.length === 0) {
    return { sent: 0, failed: 0, attempted: 0 };
  }

  const messages = recipients.map(({ token }) => ({
    to: token,
    title: String(title || "UniMarket"),
    body: String(body || ""),
    data,
    sound,
    priority: "high",
  }));

  const result = await sendExpoMessages(messages);
  if (result.invalidTokens.length > 0) {
    await deactivateInvalidTokens(result.invalidTokens);
  }

  return {
    sent: result.sent,
    failed: result.failed,
    attempted: messages.length,
  };
};

module.exports = {
  DEFAULT_NOTIFICATION_PREFERENCES,
  isExpoPushToken,
  sendNotificationToUsers,
};
