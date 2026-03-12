import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../services/api";

type User = {
  name: string;
  email: string;
};

type StoredAccount = {
  name: string;
  email: string;
  password: string;
};

type UserContextValue = {
  user: User | null;
  isHydrated: boolean;
  saveUser: (u: User) => Promise<void>;
  signUp: (input: { name: string; email: string; password: string }) => Promise<void>;
  signIn: (input: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);
const USER_STORAGE_KEY = "unimarket_user";
const ACCOUNTS_STORAGE_KEY = "unimarket_accounts";
const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const getAccounts = async (): Promise<StoredAccount[]> => {
    const raw = await AsyncStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveAccounts = async (accounts: StoredAccount[]) => {
    await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  };

  const persistCurrentUser = async (nextUser: User | null) => {
    if (!nextUser) {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  };

  const persistUserToBackend = async (nextUser: User) => {
    try {
      await fetch(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextUser.name, email: nextUser.email }),
      });
    } catch {
      // best effort only
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch {
        // ignore
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  const saveUser = async (u: User) => {
    const nextUser = {
      name: u.name.trim(),
      email: normalizeEmail(u.email),
    };
    setUser(nextUser);
    await persistCurrentUser(nextUser);
    await persistUserToBackend(nextUser);
  };

  const signUp = async (input: { name: string; email: string; password: string }) => {
    const name = input.name.trim();
    const email = normalizeEmail(input.email);
    const password = input.password;

    if (!name || !email || !password) {
      throw new Error("Name, school email, and password are required.");
    }
    if (!email.endsWith(".edu")) {
      throw new Error("Please use your school email (.edu).");
    }

    const accounts = await getAccounts();
    const exists = accounts.some((account) => normalizeEmail(account.email) === email);
    if (exists) {
      throw new Error("An account with this email already exists.");
    }

    const updatedAccounts: StoredAccount[] = [
      ...accounts,
      { name, email, password },
    ];
    await saveAccounts(updatedAccounts);
    await saveUser({ name, email });
  };

  const signIn = async (input: { email: string; password: string }) => {
    const email = normalizeEmail(input.email);
    const password = input.password;
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const accounts = await getAccounts();
    const account = accounts.find(
      (item) => normalizeEmail(item.email) === email && item.password === password
    );
    if (!account) {
      throw new Error("Invalid email or password.");
    }

    await saveUser({ name: account.name, email: account.email });
  };

  const signOut = async () => {
    setUser(null);
    await persistCurrentUser(null);
  };

  return (
    <UserContext.Provider value={{ user, isHydrated, saveUser, signUp, signIn, signOut }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
