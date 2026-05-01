import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import Footer from "../components/footer";
import { theme } from "../lib/theme";

export default function BookingUnavailableScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollInner}>
          <View style={styles.page}>
            <View style={styles.card}>
              <Text style={styles.eyebrow}>Prototype limitation</Text>
              <Text style={styles.title}>Booking is not available in this version</Text>

              <Text style={styles.text}>
                This feature is included as a proof-of-concept only. A full booking
                system would need live travel, hotel, coach, rail, payment and
                availability APIs.
              </Text>

              <Text style={styles.text}>
                These services require paid API access or commercial
                agreements. As this project is not allowed to spend money, ArtoFest
                uses mock travel and accommodation data to demonstrate how the user
                journey would work in a full product.
              </Text>

              <View style={styles.noteBox}>
                <Text style={styles.noteTitle}>No real booking has been made</Text>
                <Text style={styles.noteText}>
                  The buttons on the Book page are intentionally redirected here so
                  users understand that the page is a prototype and does not process
                  payments, reservations or live availability.
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => router.push("/book" as any)}
                >
                  <Text style={styles.primaryButtonText}>Back to Book prototype</Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => router.push("/" as any)}
                >
                  <Text style={styles.secondaryButtonText}>Explore festivals</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Footer />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  scrollInner: {
    flexGrow: 1,
    justifyContent: "space-between",
  },

  page: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 36,
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  eyebrow: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  title: {
    color: theme.colors.primary,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: "900",
    marginTop: 8,
  },

  text: {
    color: theme.colors.textMuted,
    marginTop: 14,
    fontSize: 16,
    lineHeight: 26,
  },

  noteBox: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 18,
    marginTop: 22,
  },

  noteTitle: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },

  noteText: {
    color: theme.colors.textMuted,
    marginTop: 8,
    lineHeight: 23,
  },

  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 24,
  },

  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },

  secondaryButton: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },

  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
});