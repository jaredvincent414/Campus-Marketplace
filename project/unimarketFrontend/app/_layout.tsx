// Root layout with Stack navigator and ListingsProvider
import { Stack } from "expo-router";
import { ListingsProvider } from "../src/contexts/ListingsContext";
import { UserProvider } from "../src/contexts/UserContext";

export default function RootLayout() {
  return (
    <ListingsProvider>
      <UserProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(modals)/create-listing"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
        </Stack>
      </UserProvider>
    </ListingsProvider>
  );
}
