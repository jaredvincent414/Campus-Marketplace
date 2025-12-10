import React, { createContext, useContext, useEffect, useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../services/api";

type User = {
  name: string;
  email: string;
};

type UserContextValue = {
  user: User | null;
  saveUser: (u: User) => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tempName, setTempName] = useState("");
  const [tempEmail, setTempEmail] = useState("");


  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("unimarket_user");
        if (raw) setUser(JSON.parse(raw));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const saveUser = async (u: User) => {
    setUser(u);
    try {
      await AsyncStorage.setItem("unimarket_user", JSON.stringify(u));
    } catch (e) {
      // ignore
    }

    // try to persist to backend (best-effort)
    try {
      await fetch(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: u.name, email: u.email }),
      });
    } catch (e) {
      // best-effort only
    }
  };

  return (
    <UserContext.Provider value={{ user, saveUser }}>
      {children}
      {user === null ? (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Welcome — enter your name & email</Text>
            <TextInput
              placeholder="Full name"
              value={tempName}
              onChangeText={setTempName}
              style={styles.input}
              autoCapitalize="words"
            />
            <TextInput
              placeholder="Email"
              value={tempEmail}
              onChangeText={setTempEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              title="Save"
              onPress={() => {
                const u = { name: tempName.trim(), email: tempEmail.trim() } as User;
                if (u.name && u.email) saveUser(u);
              }}
            />
          </View>
        </View>
      ) : null}
    </UserContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "90%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 8,
    marginBottom: 12,
    borderRadius: 4,
  },
});

export default UserProvider;
