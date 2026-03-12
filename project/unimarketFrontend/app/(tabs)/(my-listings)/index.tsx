// My Listings tab - shows user's listings
import React, { useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useListings } from "../../../src/contexts/ListingsContext";
import { useUser } from "../../../src/contexts/UserContext";
import { ListingList } from "../../../src/components/ListingList";
import { Ionicons } from "@expo/vector-icons";

export default function MyListingsScreen() {
  const router = useRouter();
  const { userListings, loadUserListings, isLoading } = useListings();
  const { user } = useUser();

  useEffect(() => {
    if (user?.email) {
      loadUserListings(user.email);
    }
  }, [user?.email]);

  const handleDeleteListing = () => {
    if (user?.email) {
      loadUserListings(user.email);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Listings</Text>
          <Text style={styles.headerSubtitle}>
            {userListings.length} active {userListings.length === 1 ? "listing" : "listings"}
          </Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => router.push("/(modals)/create-listing")}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <ListingList
            data={userListings}
            onPressListing={() => {}}
            userEmail={user?.email}
            onDeleteListing={handleDeleteListing}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#222222",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#717171",
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FF385C",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#717171",
  },
});


