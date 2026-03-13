import { Feather } from "@expo/vector-icons";
import { Link, usePathname } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../lib/theme";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "Plan", href: "/plan" },
  { label: "Book", href: "/book" },
  { label: "Stream", href: "/stream" },
] as const;

export default function TopNav() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isMobile = width < 760;

  function isActive(href: (typeof navItems)[number]["href"]) {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href;
  }

  if (isMobile) {
    return (
      <View style={[styles.outer, { paddingTop: insets.top }]}>
        <View style={styles.mobileTopRow}>
          <Link href="/" asChild>
            <Pressable style={styles.mobileLogoWrap}>
              <Image
                source={require("../assets/images/artofest-logo.png")}
                style={styles.mobileLogo}
                resizeMode="contain"
              />
            </Pressable>
          </Link>

          <Link href="/profile" asChild>
            <Pressable style={styles.mobileProfileButton}>
              <Feather name="user" size={24} color={theme.colors.text} />
            </Pressable>
          </Link>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mobileNavScrollContent}
        >
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href} asChild>
                <Pressable
                  style={[
                    styles.mobileNavButton,
                    active ? styles.mobileNavButtonActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.mobileNavText,
                      active ? styles.mobileNavTextActive : null,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.outer, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <Link href="/" asChild>
          <Pressable style={styles.logoWrap}>
            <Image
              source={require("../assets/images/artofest-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Pressable>
        </Link>

        <View style={styles.navCenter}>
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href} asChild>
                <Pressable style={styles.navButton}>
                  <Text style={[styles.navText, active && styles.navTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>

        <Link href="/profile" asChild>
          <Pressable style={styles.profileButton}>
            <Feather name="user" size={28} color={theme.colors.text} />
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  inner: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    minHeight: 88,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logoWrap: {
    width: 170,
    justifyContent: "center",
  },

  logo: {
    width: 150,
    height: 58,
  },

  navCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Platform.OS === "web" ? 26 : 16,
    flex: 1,
    paddingHorizontal: 12,
  },

  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },

  navText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textMuted,
  },

  navTextActive: {
    color: theme.colors.primary,
  },

  profileButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },

  mobileTopRow: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  mobileLogoWrap: {
    flex: 1,
    justifyContent: "center",
  },

  mobileLogo: {
    width: 120,
    height: 42,
  },

  mobileProfileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    marginLeft: 10,
  },

  mobileNavScrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },

  mobileNavButton: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  mobileNavButtonActive: {
    backgroundColor: theme.colors.primary,
  },

  mobileNavText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.textMuted,
  },

  mobileNavTextActive: {
    color: theme.colors.surface,
  },
});
