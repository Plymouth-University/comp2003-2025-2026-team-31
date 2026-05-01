import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
import {
  extractMessage,
  isValidEmail,
  normaliseEmail,
} from "../../lib/auth-helpers";
import { theme } from "../../lib/theme";

type FormState = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

type BannerState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

function validateForm(form: FormState): FieldErrors {
  const errors: FieldErrors = {};
  const username = form.username.trim();
  const email = normaliseEmail(form.email);
  const password = form.password;
  const confirmPassword = form.confirmPassword;

  if (!username) {
    errors.username = "Enter a username.";
  } else if (username.length < 3) {
    errors.username = "Username must be at least 3 characters.";
  }

  if (!email) {
    errors.email = "Enter your email address.";
  } else if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Enter a password.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
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
  helperText,
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
  helperText?: string;
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

      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.fieldHelper}>{helperText}</Text>
      ) : null}
    </View>
  );
}

export default function SignupScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 980;

  const [form, setForm] = useState<FormState>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<BannerState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const trimmedUsername = useMemo(() => form.username.trim(), [form.username]);
  const cleanedEmail = useMemo(() => normaliseEmail(form.email), [form.email]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setFieldErrors((current) => {
      if (!current[key]) return current;
      return {
        ...current,
        [key]: undefined,
      };
    });

    if (banner?.tone === "error") {
      setBanner(null);
    }
  }

  function resetForm() {
    setForm({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setFieldErrors({});
    setBanner(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  function goToLogin() {
    router.push({
      pathname: "/login",
      params: cleanedEmail ? { email: cleanedEmail } : {},
    });
  }

  async function handleCreateAccount() {
    if (isSubmitting) return;

    const nextErrors = validateForm(form);
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
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: trimmedUsername,
          email: cleanedEmail,
          password: form.password,
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
          "We could not create your account. Please try again.";

        setBanner({
          tone: "error",
          message: apiMessage,
        });
        return;
      }

      const successMessage =
        extractMessage(payload) ||
        "Your ArtoFest account has been created successfully.";

      setBanner({
        tone: "success",
        message: successMessage,
      });

      setForm((current) => ({
        ...current,
        password: "",
        confirmPassword: "",
      }));
      setFieldErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
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
            <Text style={styles.title}>Create your free ArtoFest account</Text>
            <Text style={styles.subtitle}>
              Set up your account.
            </Text>

            <View style={[styles.columns, isWide ? styles.columnsWide : null]}>
              <View style={[styles.infoCard, isWide ? styles.infoCardWide : null]}>
                <Text style={styles.infoTitle}>Why create an account?</Text>

                <View style={styles.infoList}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoIconWrap}>
                      <Feather
                        name="heart"
                        size={16}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.infoCopy}>
                      <Text style={styles.infoItemTitle}>Save your favourites</Text>
                      <Text style={styles.infoItemText}>
                        Be able to save all of your favourite festivals in once place.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <View style={styles.infoIconWrap}>
                      <Feather
                        name="map-pin"
                        size={16}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.infoCopy}>
                      <Text style={styles.infoItemTitle}>Plan more easily</Text>
                      <Text style={styles.infoItemText}>
                        We are building ArtoFest around discovering and planning
                        better festival experiences.
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.infoNote}>
                  <Text style={styles.infoNoteText}>
                    After registration, log in on the separate login screen to
                    start a session in the app.
                  </Text>
                </View>
              </View>

              <View style={[styles.formCard, isWide ? styles.formCardWide : null]}>
                <Text style={styles.formTitle}>Create account</Text>
                <Text style={styles.formText}>
                  Fill in the form below to register with ArtoFest.
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
                  label="Username"
                  value={form.username}
                  onChangeText={(value) => updateField("username", value)}
                  placeholder="Enter your username"
                  autoCapitalize="none"
                  error={fieldErrors.username}
                  helperText="At least 3 characters."
                  autoComplete="username"
                />

                <FormField
                  label="Email address"
                  value={form.email}
                  onChangeText={(value) => updateField("email", value)}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={fieldErrors.email}
                  autoComplete="email"
                />

                <FormField
                  label="Password"
                  value={form.password}
                  onChangeText={(value) => updateField("password", value)}
                  placeholder="Create a password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  error={fieldErrors.password}
                  helperText="Use at least 8 characters."
                  rightIcon={showPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowPassword((current) => !current)}
                  autoComplete="new-password"
                />

                <FormField
                  label="Confirm password"
                  value={form.confirmPassword}
                  onChangeText={(value) =>
                    updateField("confirmPassword", value)
                  }
                  placeholder="Re-enter your password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  error={fieldErrors.confirmPassword}
                  rightIcon={showConfirmPassword ? "eye-off" : "eye"}
                  onRightIconPress={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  autoComplete="new-password"
                />

                <View style={styles.legalBlock}>
                  <Text style={styles.legalText}>
                    By creating an account, you agree to our policies.
                  </Text>

                  <View style={styles.legalLinksRow}>
                    <Link href="/terms-of-service" asChild>
                      <Pressable>
                        <Text style={styles.legalLink}>Terms of Service</Text>
                      </Pressable>
                    </Link>

                    <Text style={styles.legalDivider}>•</Text>

                    <Link href="/privacy-policy" asChild>
                      <Pressable>
                        <Text style={styles.legalLink}>Privacy Policy</Text>
                      </Pressable>
                    </Link>
                  </View>
                </View>

                <View style={styles.buttonRow}>
                  <Pressable
                    onPress={handleCreateAccount}
                    disabled={isSubmitting}
                    style={[
                      styles.primaryButton,
                      isSubmitting ? styles.primaryButtonDisabled : null,
                    ]}
                  >
                    {isSubmitting ? (
                      <View style={styles.loadingRow}>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.primaryButtonText}>
                          Creating account...
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.primaryButtonText}>
                        Create Account
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={goToLogin}
                    disabled={isSubmitting}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>
                      Already have an account? Log In
                    </Text>
                  </Pressable>

                  <Link href="/profile" asChild>
                    <Pressable style={styles.tertiaryButton}>
                      <Text style={styles.tertiaryButtonText}>
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

  infoNote: {
    marginTop: 22,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
  },

  infoNoteText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
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

  fieldHelper: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  fieldError: {
    color: "#b24343",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    fontWeight: "700",
  },

  legalBlock: {
    marginTop: 20,
  },

  legalText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },

  legalLinksRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  legalLink: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },

  legalDivider: {
    color: theme.colors.textMuted,
    marginHorizontal: 8,
    fontSize: 14,
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

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});