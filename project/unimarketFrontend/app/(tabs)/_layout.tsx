// Tabs layout for main navigation
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#2563eb",
        },
        headerTintColor: "#fff",
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#666",
      }}
    >
      <Tabs.Screen
        name="(market)/index"
        options={{
          title: "Market",
          tabBarLabel: "Market",
        }}
      />
      <Tabs.Screen
        name="(my-listings)/index"
        options={{
          title: "My Listings",
          tabBarLabel: "My Listings",
        }}
      />
      <Tabs.Screen
        name="(profile)/index"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
        }}
      />
    </Tabs>
  );
}



