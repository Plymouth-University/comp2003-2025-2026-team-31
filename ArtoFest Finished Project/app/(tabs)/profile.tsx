import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import Footer from "../../components/footer";
import { useAuth } from "../../lib/auth-context";
import { theme } from "../../lib/theme";

function FeatureRow({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconWrap}>
        <Feather name={icon} size={16} color={theme.colors.primary} />
      </View>

      <View style={styles.featureCopy}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>
    </View>
  );
}

function formatDisplayName(email: string, username?: string | null) {
  if (username && username.trim()) {
    return username.trim();
  }

  const localPart = email.split("@")[0] || "User";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();

  return cleaned
    ? cleaned.replace(/\b\w/g, (char) => char.toUpperCase())
    : "User";
}

function formatLoggedInDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Session active";
  }

  return date.toLocaleString();
}

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 960;

  const { session, isAuthenticated, isHydrating, logout } = useAuth();

  const displayName = useMemo(() => {
    if (!session) return "User";
    return formatDisplayName(session.email, session.username);
  }, [session]);

  async function handleLogout() {
    await logout();
    router.replace("/profile");
  }

  if (isHydrating) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingScreenText}>Loading account session...</Text>
      </View>
    );
  }

  if (isAuthenticated && session) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageShell}>
          <View style={styles.page}>
            <Text style={styles.eyebrow}>Account</Text>
            <Text style={styles.title}>Welcome back, {displayName}</Text>
            

            <View style={[styles.columns, isWide ? styles.columnsWide : null]}>
              <View style={[styles.optionCard, isWide ? styles.optionCardWide : null]}>
                <View style={styles.optionTopRow}>
                  <View style={styles.optionIconWrap}>
                    <Feather name="user-check" size={20} color={theme.colors.primary} />
                  </View>

                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>Signed in</Text>
                  </View>
                </View>

                <Text style={styles.optionTitle}>Account summary</Text>
                

                <View style={styles.accountInfoBlock}>
                  <View style={styles.accountInfoRow}>
                    <Text style={styles.accountInfoLabel}>Email</Text>
                    <Text style={styles.accountInfoValue}>{session.email}</Text>
                  </View>

                  <View style={styles.accountInfoRow}>
                    <Text style={styles.accountInfoLabel}>Session started</Text>
                    <Text style={styles.accountInfoValue}>
                      {formatLoggedInDate(session.loggedInAt)}
                    </Text>
                  </View>

                  
                </View>
              </View>

              <View style={[styles.optionCard, isWide ? styles.optionCardWide : null]}>
                <View style={styles.optionTopRow}>
                  <View style={styles.optionIconWrap}>
                    <Feather name="settings" size={20} color={theme.colors.primary} />
                  </View>
                </View>

                <Text style={styles.optionTitle}>Account actions</Text>
      
                <Link href="/" asChild>
                  <Pressable style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>Go to Home</Text>
                  </Pressable>
                </Link>

                <Link href="/explore" asChild>
                  <Pressable style={styles.secondaryAccentButton}>
                    <Text style={styles.secondaryAccentButtonText}>
                      Explore Festivals
                    </Text>
                  </Pressable>
                </Link>

                <Pressable style={styles.logoutButton} onPress={handleLogout}>
                  <Text style={styles.logoutButtonText}>Log Out</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Footer />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageShell}>
        <View style={styles.page}>
          <Text style={styles.eyebrow}>Account</Text>
          <Text style={styles.title}>Access your ArtoFest account</Text>
          <Text style={styles.subtitle}>
            Log in if you already have an account or create a new one to start
            building your ArtoFest experience.
          </Text>

          <View style={[styles.columns, isWide ? styles.columnsWide : null]}>
            <View style={[styles.optionCard, isWide ? styles.optionCardWide : null]}>
              <View style={styles.optionTopRow}>
                <View style={styles.optionIconWrap}>
                  <Feather name="log-in" size={20} color={theme.colors.primary} />
                </View>
              </View>

              <Text style={styles.optionTitle}>Log in</Text>
              <Text style={styles.optionText}>
                Already registered?
              </Text>

              <View style={styles.featureList}>
                <FeatureRow
                  icon="mail"
                  title="Quick access"
                  text="Sign in securely using your email and password."
                />
                <FeatureRow
                  icon="shield"
                  title="Stay signed in"
                  text="Keep your session active on this device for faster future access."
                />
              </View>

              <Link href="/login" asChild>
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Log In</Text>
                </Pressable>
              </Link>
            </View>

            <View style={[styles.optionCard, isWide ? styles.optionCardWide : null]}>
              <View style={styles.optionTopRow}>
                <View style={styles.optionIconWrap}>
                  <Feather
                    name="user-plus"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
              </View>

              <Text style={styles.optionTitle}>Sign up</Text>
              <Text style={styles.optionText}>
                Create a new account?
              </Text>

              <View style={styles.featureList}>
                <FeatureRow
                  icon="check-circle"
                  title="Simple registration"
                  text="Create your account in just a few easy steps."
                />
                <FeatureRow
                  icon="user"
                  title="Helpful feedback"
                  text="We’ll guide you if anything needs correcting before you continue."
                />
              </View>

              <Link href="/signup" asChild>
                <Pressable style={styles.secondaryAccentButton}>
                  <Text style={styles.secondaryAccentButtonText}>
                    Create Account
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>

          <View style={styles.bottomNote}>
            <Text style={styles.bottomNoteText}>
              By continuing, you agree to our policies.
            </Text>

            <View style={styles.bottomLinksRow}>
              <Link href="/terms-of-service" asChild>
                <Pressable>
                  <Text style={styles.bottomLink}>Terms of Service</Text>
                </Pressable>
              </Link>

              <Text style={styles.bottomDivider}>•</Text>

              <Link href="/privacy-policy" asChild>
                <Pressable>
                  <Text style={styles.bottomLink}>Privacy Policy</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>

        <Footer />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  loadingScreenText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  contentContainer: {
    flexGrow: 1,
  },

  pageShell: {
    flex: 1,
    justifyContent: "space-between",
  },

  page: {
    width: "100%",
    maxWidth: 1980,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
  },

  eyebrow: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  title: {
    color: theme.colors.primary,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "900",
    maxWidth: 760,
  },

  subtitle: {
    color: theme.colors.textMuted,
    marginTop: 12,
    fontSize: 17,
    lineHeight: 28,
    maxWidth: 760,
  },

  columns: {
    marginTop: 24,
    gap: 20,
  },

  columnsWide: {
    flexDirection: "row",
    alignItems: "stretch",
  },

  optionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 24,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  optionCardWide: {
    flex: 1,
  },

  optionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  optionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: "#efe7f4",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  statusPillText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  statusPillMuted: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  statusPillMutedText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  optionTitle: {
    color: theme.colors.primary,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    marginTop: 18,
  },

  optionText: {
    color: theme.colors.textMuted,
    marginTop: 10,
    fontSize: 15,
    lineHeight: 24,
  },

  featureList: {
    marginTop: 18,
    gap: 14,
  },

  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  featureIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  featureCopy: {
    flex: 1,
  },

  featureTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },

  featureText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },

  accountInfoBlock: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 14,
  },

  accountInfoRow: {
    gap: 4,
  },

  accountInfoLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  accountInfoValue: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
  },

  primaryButton: {
    minHeight: 54,
    marginTop: 22,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryAccentButton: {
    minHeight: 54,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  secondaryAccentButtonText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },

  logoutButton: {
    minHeight: 54,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: "#fff3f3",
    borderWidth: 1,
    borderColor: "#efc1c1",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  logoutButtonText: {
    color: "#8a2e2e",
    fontSize: 15,
    fontWeight: "800",
  },

  bottomNote: {
    marginTop: 24,
    paddingTop: 4,
  },

  bottomNoteText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },

  bottomLinksRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  bottomLink: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },

  bottomDivider: {
    color: theme.colors.textMuted,
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: "700",
  },
});