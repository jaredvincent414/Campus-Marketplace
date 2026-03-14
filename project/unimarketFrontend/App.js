import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ListingsScreen from "./screens/ListingsScreen";
import ListingDetailsScreen from "./screens/ListingDetailsScreen";
import CreateListingScreen from "./screens/CreateListingScreen";

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Listings">
                <Stack.Screen
                    name="Listings"
                    component={ListingsScreen}
                    options={{ title: "Listings" }}
                />
                <Stack.Screen
                    name="ListingDetails"
                    component={ListingDetailsScreen}
                    options={({ route }) => ({
                        title: route.params?.listing?.title || "Details",
                    })}
                />
                <Stack.Screen
                    name="CreateListing"
                    component={CreateListingScreen}
                    options={{ title: "New Listing" }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

