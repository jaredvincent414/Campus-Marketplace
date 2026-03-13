// Root layout with Stack navigator and ListingsProvider
import { Stack } from "expo-router";
import { ListingsProvider } from "../src/contexts/ListingsContext";
import { UserProvider } from "../src/contexts/UserContext";
import { SavedListingsProvider } from "../src/contexts/SavedListingsContext";

export default function RootLayout() {
  return (
    <ListingsProvider>
      <UserProvider>
        <SavedListingsProvider>
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
        </SavedListingsProvider>
      </UserProvider>
    </ListingsProvider>
  );
}
