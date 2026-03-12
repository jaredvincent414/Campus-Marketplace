// Tabs layout for main navigation
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";

export default function TabsLayout() {
  const renderTabIcon = (
    name: keyof typeof Ionicons.glyphMap,
    color: string,
    size: number,
    focused: boolean
  ) => (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <Ionicons name={name} size={size} color={color} />
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF385C",
        tabBarInactiveTintColor: "#787878",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#F0F0F0",
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.03,
          shadowRadius: 6,
          elevation: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
      }}
    >
      <Tabs.Screen
        name="(market)/index"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size, focused }) => (
            renderTabIcon("search", color, size, focused)
          ),
        }}
      />
      <Tabs.Screen
        name="(my-listings)/index"
        options={{
          title: "My Listings",
          tabBarIcon: ({ color, size, focused }) => (
            renderTabIcon("heart-outline", color, size, focused)
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            renderTabIcon("person-circle-outline", color, size, focused)
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    minWidth: 34,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapFocused: {
    backgroundColor: "#FFF1F4",
  },
});


