// Root layout with Stack navigator and ListingsProvider
import { Stack } from "expo-router";
import { ListingsProvider } from "../src/contexts/ListingsContext";
import { UserProvider } from "../src/contexts/UserContext";

export default function RootLayout() {
  return (
    <ListingsProvider>
      <UserProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(modals)/create-listing"
            options={{
              presentation: "modal",
              title: "Create Listing",
              headerStyle: {
                backgroundColor: "#2563eb",
              },
              headerTintColor: "#fff",
            }}
          />
        </Stack>
      </UserProvider>
    </ListingsProvider>
  );
}



