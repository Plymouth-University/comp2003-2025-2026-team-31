import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_STORAGE_KEY = "artofest.auth.session";

function canUseWebStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export async function saveAuthSession(value: string) {
  if (Platform.OS === "web") {
    if (canUseWebStorage()) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, value);
    }
    return;
  }

  await SecureStore.setItemAsync(AUTH_STORAGE_KEY, value);
}

export async function getAuthSession() {
  if (Platform.OS === "web") {
    if (!canUseWebStorage()) return null;
    return window.localStorage.getItem(AUTH_STORAGE_KEY);
  }

  return SecureStore.getItemAsync(AUTH_STORAGE_KEY);
}

export async function clearAuthSession() {
  if (Platform.OS === "web") {
    if (canUseWebStorage()) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    return;
  }

  await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
}