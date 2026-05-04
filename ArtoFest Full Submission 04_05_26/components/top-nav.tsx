import { Ionicons } from "@expo/vector-icons";
import { Link, usePathname } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "Plan", href: "/plan" },
  { label: "Book", href: "/book" },
  { label: "Stream", href: "/stream" },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/" || pathname === "/index";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function mergeStyles(...items: any[]) {
  return StyleSheet.flatten(items.filter(Boolean));
}

function LogoMark() {
  return (
    <Text style={styles.logoText}>
      <Text style={styles.logoArto}>arto</Text>
      <Text style={styles.logoFest}>fest</Text>
    </Text>
  );
}

export default function TopNav() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const isCompact = width < 760;

  if (isCompact) {
    return (
      <View style={styles.navOuter}>
        <View style={styles.mobileInner}>
          <View style={styles.mobileTopRow}>
            <Link href="/" asChild>
              <Pressable style={styles.logoButton}>
                <LogoMark />
              </Pressable>
            </Link>

            <Link href="/profile" asChild>
              <Pressable
                style={mergeStyles(
                  styles.profileButton,
                  pathname === "/profile" ||
                    pathname === "/login" ||
                    pathname === "/signup"
                    ? styles.profileButtonActive
                    : null
                )}
              >
                <Ionicons name="person-outline" size={22} color="#5b1b68" />
              </Pressable>
            </Link>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.mobileNavScroll}
            contentContainerStyle={styles.mobileNavContent}
          >
            {NAV_ITEMS.map((item, index) => {
              const active = isActiveRoute(pathname, item.href);

              return (
                <Link key={item.href} href={item.href as any} asChild>
                  <Pressable
                    style={mergeStyles(
                      styles.mobileNavButton,
                      active ? styles.mobileNavButtonActive : null,
                      index !== NAV_ITEMS.length - 1
                        ? styles.mobileNavButtonSpacing
                        : null
                    )}
                  >
                    <Text
                      style={mergeStyles(
                        styles.navTextMobile,
                        active ? styles.navTextActive : null
                      )}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.navOuter}>
      <View style={styles.desktopInner}>
        <View style={styles.logoSlot}>
          <Link href="/" asChild>
            <Pressable style={styles.logoButton}>
              <LogoMark />
            </Pressable>
          </Link>
        </View>

        <View style={styles.desktopNavArea}>
          {NAV_ITEMS.map((item) => {
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link key={item.href} href={item.href as any} asChild>
                <Pressable style={styles.desktopNavButton}>
                  <Text
                    style={mergeStyles(
                      styles.navTextDesktop,
                      active ? styles.navTextActive : null
                    )}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>

        <View style={styles.profileSlot}>
          <Link href="/profile" asChild>
            <Pressable
              style={mergeStyles(
                styles.profileButton,
                pathname === "/profile" ||
                  pathname === "/login" ||
                  pathname === "/signup"
                  ? styles.profileButtonActive
                  : null
              )}
            >
              <Ionicons name="person-outline" size={24} color="#5b1b68" />
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navOuter: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(91, 27, 104, 0.12)",
    zIndex: 1000,
  },

  desktopInner: {
    width: "100%",
    minHeight: 86,
    paddingHorizontal: Platform.OS === "web" ? 28 : 14,
    flexDirection: "row",
    alignItems: "center",
  },

  mobileInner: {
    width: "100%",
    paddingTop: Platform.OS === "web" ? 10 : 44,
    paddingBottom: 8,
    paddingHorizontal: 12,
  },

  mobileTopRow: {
    width: "100%",
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logoSlot: {
    width: 260,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  logoButton: {
    justifyContent: "center",
  },

  logoText: {
    fontSize: Platform.OS === "web" ? 36 : 28,
    fontWeight: "900",
    letterSpacing: -1,
  },

  logoArto: {
    color: "#f49b1a",
  },

  logoFest: {
    color: "#b455a6",
  },

  desktopNavArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 40,
  },

  desktopNavButton: {
    minWidth: 90,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  mobileNavScroll: {
    width: "100%",
    marginTop: 6,
  },

  mobileNavContent: {
    alignItems: "center",
    paddingRight: 12,
  },

  mobileNavButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },

  mobileNavButtonSpacing: {
    marginRight: 8,
  },

  mobileNavButtonActive: {
    backgroundColor: "rgba(91, 27, 104, 0.08)",
  },

  navTextDesktop: {
    fontSize: 22,
    fontWeight: "800",
    color: "#7d5a83",
  },

  navTextMobile: {
    fontSize: 15,
    fontWeight: "800",
    color: "#7d5a83",
  },

  navTextActive: {
    color: "#4f0f5f",
    fontWeight: "900",
  },

  profileSlot: {
    width: 260,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  profileButton: {
    width: Platform.OS === "web" ? 50 : 44,
    height: Platform.OS === "web" ? 50 : 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(91, 27, 104, 0.18)",
    backgroundColor: "#ffffff",
  },

  profileButtonActive: {
    backgroundColor: "#f3e8f6",
    borderColor: "#5b1b68",
  },
});