import { Feather } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import Footer from "../../components/footer";
import { API_BASE_URL } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import {
  extractMessage,
  extractToken,
  extractUsername,
  isValidEmail,
  normaliseEmail,
} from "../../lib/auth-helpers";
import { theme } from "../../lib/theme";

type FieldErrors = {
  email?: string;
  password?: string;
};

type BannerState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

function validateLogin(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const cleanedEmail = normaliseEmail(email);

  if (!cleanedEmail) {
    errors.email = "Enter your email address.";
  } else if (!isValidEmail(cleanedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  error,
  rightIcon,
  onRightIconPress,
  autoComplete,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  error?: string;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  autoComplete?:
    | "username"
    | "email"
    | "new-password"
    | "current-password"
    | "off";
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={[styles.inputWrap, error ? styles.inputWrapError : null]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
        />

        {rightIcon && onRightIconPress ? (
          <Pressable
            onPress={onRightIconPress}
            style={styles.inputIconButton}
            hitSlop={8}
          >
            <Feather
              name={rightIcon}
              size={18}
              color={theme.colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, isHydrating } = useAuth();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { width } = useWindowDimensions();
  const isWide = width >= 980;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<BannerState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (typeof emailParam === "string" && emailParam.trim()) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  useEffect(() => {
    if (!isHydrating && isAuthenticated) {
      router.replace("/profile");
    }
  }, [isAuthenticated, isHydrating, router]);

  const cleanedEmail = useMemo(() => normaliseEmail(email), [email]);

  function updateEmail(value: string) {
    setEmail(value);

    setFieldErrors((current) => {
      if (!current.email) return current;
      return { ...current, email: undefined };
    });

    if (banner?.tone === "error") {
      setBanner(null);
    }
  }

  function updatePassword(value: string) {
    setPassword(value);

    setFieldErrors((current) => {
      if (!current.password) return current;
      return { ...current, password: undefined };
    });

    if (banner?.tone === "error") {
      setBanner(null);
    }
  }

  function clearForm() {
    setPassword("");
    setFieldErrors({});
    setBanner(null);
    setShowPassword(false);
  }

  async function handleLogin() {
    if (isSubmitting) return;

    const nextErrors = validateLogin(email, password);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setBanner({
        tone: "error",
        message: "Please fix the highlighted fields and try again.",
      });
      return;
    }

    setBanner(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanedEmail,
          password,
        }),
      });

      const rawText = await response.text();

      let payload: unknown = null;
      try {
        payload = rawText ? JSON.parse(rawText) : null;
      } catch {
        payload = rawText;
      }

      if (!response.ok) {
        const apiMessage =
          extractMessage(payload) ||
          "We could not log you in. Please check your details and try again.";

        setBanner({
          tone: "error",
          message: apiMessage,
        });
        return;
      }

      const token = extractToken(payload);

      if (!token) {
        setBanner({
          tone: "error",
          message:
            "The login response succeeded but no token was returned. The backend response needs checking.",
        });
        return;
      }

      const username = extractUsername(payload);

      await login({
        token,
        email: cleanedEmail,
        username,
      });

      setPassword("");
      setFieldErrors({});
      setShowPassword(false);

      router.replace("/profile");
    } catch {
      setBanner({
        tone: "error",
        message:
          "We could not reach the server. Check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isHydrating) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingScreenText}>Loading account session...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardSafe}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageShell}>
          <View style={styles.page}>
            <Text style={styles.eyebrow}>Account</Text>
            <Text style={styles.title}>Log in to ArtoFest</Text>
            <Text style={styles.subtitle}>
              Sign in using your email address and password.
            </Text>

            <View style={[styles.columns, isWide ? styles.columnsWide : null]}>
              <View style={[styles.infoCard, isWide ? styles.infoCardWide : null]}>
                <Text style={styles.infoTitle}>Login details</Text>

                <View style={styles.infoList}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoIconWrap}>
                      <Feather
                        name="mail"
                        size={16}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.infoCopy}>
                      <Text style={styles.infoItemTitle}>Use your registered email</Text>
                      <Text style={styles.infoItemText}>
                        Enter the same email address used when you created your
                        account.
                      </Text>
                    </View>
                  </View>                 
                </View>
              </View>

              <View style={[styles.formCard, isWide ? styles.formCardWide : null]}>
                <Text style={styles.formTitle}>Log in</Text>
                <Text style={styles.formText}>
                  Enter your details below to authenticate with ArtoFest.
                </Text>

                {banner ? (
                  <View
                    style={[
                      styles.banner,
                      banner.tone === "success"
                        ? styles.bannerSuccess
                        : styles.bannerError,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bannerText,
                        banner.tone === "success"
                          ? styles.bannerTextSuccess
                          : styles.bannerTextError,
                      ]}
                    >
                      {banner.message}
                    </Text>
                  </View>
                ) : null}

                <FormField
                  label="Email address"
                  value={email}
                  onChangeText={updateEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={fieldErrors.email}
                  autoComplete="email"
                />

                <FormField
                  label="Password"
                  value={password}
                  onChangeText={updatePassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  error={fieldErrors.password}
                  rightIcon={showPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowPassword((current) => !current)}
                  autoComplete="current-password"
                />

                <View style={styles.buttonRow}>
                  <Pressable
                    onPress={handleLogin}
                    disabled={isSubmitting}
                    style={[
                      styles.primaryButton,
                      isSubmitting ? styles.primaryButtonDisabled : null,
                    ]}
                  >
                    {isSubmitting ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.primaryButtonText}>Logging in...</Text>
                      </View>
                    ) : (
                      <Text style={styles.primaryButtonText}>Log In</Text>
                    )}
                  </Pressable>

                  <Link href="/signup" asChild>
                    <Pressable style={styles.tertiaryButton}>
                      <Text style={styles.tertiaryButtonText}>
                        Need an account? Sign Up
                      </Text>
                    </Pressable>
                  </Link>

                  <Link href="/profile" asChild>
                    <Pressable style={styles.quaternaryButton}>
                      <Text style={styles.quaternaryButtonText}>
                        Back to account options
                      </Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            </View>
          </View>

          <Footer />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardSafe: {
    flex: 1,
  },

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
    maxWidth: 1280,
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
    alignItems: "flex-start",
  },

  infoCard: {
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

  infoCardWide: {
    flex: 1,
    maxWidth: 430,
  },

  formCard: {
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

  formCardWide: {
    flex: 1.2,
  },

  infoTitle: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: "900",
  },

  infoList: {
    marginTop: 18,
    gap: 16,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  infoCopy: {
    flex: 1,
  },

  infoItemTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
  },

  infoItemText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 4,
  },

  formTitle: {
    color: theme.colors.primary,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
  },

  formText: {
    color: theme.colors.textMuted,
    marginTop: 10,
    fontSize: 15,
    lineHeight: 24,
  },

  banner: {
    marginTop: 18,
    marginBottom: 6,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },

  bannerSuccess: {
    backgroundColor: "#eef8f1",
    borderColor: "#b9ddc1",
  },

  bannerError: {
    backgroundColor: "#fff3f3",
    borderColor: "#efc1c1",
  },

  bannerText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },

  bannerTextSuccess: {
    color: "#216437",
  },

  bannerTextError: {
    color: "#8a2e2e",
  },

  fieldBlock: {
    marginTop: 18,
  },

  fieldLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },

  inputWrap: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSoft,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 10,
  },

  inputWrapError: {
    borderColor: "#d97b7b",
    backgroundColor: "#fff9f9",
  },

  input: {
    flex: 1,
    minHeight: 56,
    color: theme.colors.text,
    fontSize: 16,
  },

  inputIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  fieldError: {
    color: "#b24343",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    fontWeight: "700",
  },

  buttonRow: {
    marginTop: 24,
    gap: 12,
  },

  primaryButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  primaryButtonDisabled: {
    opacity: 0.72,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },

  tertiaryButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  tertiaryButtonText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },

  quaternaryButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  quaternaryButtonText: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: "800",
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});