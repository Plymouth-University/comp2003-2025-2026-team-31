import { Feather } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import Footer from "../../components/footer";
import {
  FestivalRecord,
  buildFestivalLocation,
  fetchFestivalById,
  formatFestivalFullDateRange,
  normaliseMonth,
  normaliseString,
  safeWebUrl,
  toNumericId,
} from "../../lib/festivals";
import { theme } from "../../lib/theme";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  if (!value.trim()) return null;

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function FestivalDetailPage() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const festivalId = useMemo(() => {
    const raw = Array.isArray(params.id) ? params.id[0] : params.id;
    return toNumericId(raw);
  }, [params.id]);

  const [festival, setFestival] = useState<FestivalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFestival() {
      if (typeof festivalId !== "number" || !Number.isFinite(festivalId)) {
        setError("Invalid festival ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetchFestivalById(festivalId);

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as FestivalRecord;

        setFestival({
          id: toNumericId(data.id),
          name: normaliseString(data.name),
          city: normaliseString(data.city),
          country: normaliseString(data.country),
          image_url: normaliseString(data.image_url),
          website: normaliseString(data.website),
          start_date: data.start_date ?? null,
          end_date: data.end_date ?? null,
          month_text: normaliseString(data.month_text),
          art_form: normaliseString(data.art_form),
          description: normaliseString(data.description),
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        });
      } catch (err) {
        console.error("Failed to load festival details:", err);
        setError("Failed to load this festival.");
      } finally {
        setLoading(false);
      }
    }

    loadFestival();
  }, [festivalId]);

  async function openOfficialWebsite() {
    const website = safeWebUrl(normaliseString(festival?.website));
    if (!website) return;

    try {
      await Linking.openURL(website);
    } catch (err) {
      console.error("Failed to open website:", err);
    }
  }

  const title = normaliseString(festival?.name) || "Festival";
  const fullDateText = formatFestivalFullDateRange(
    festival?.start_date,
    festival?.end_date,
    festival?.month_text
  );
  const locationText = buildFestivalLocation(festival ?? {}) || "Location TBC";
  const artFormText = normaliseString(festival?.art_form);
  const monthText = normaliseMonth(festival?.month_text, festival?.start_date);
  const descriptionText =
    normaliseString(festival?.description) ||
    "A full festival description will appear here once it has been added to the database.";
  const websiteText = normaliseString(festival?.website);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.page}>
        <Link href="/" asChild>
          <Pressable style={styles.backButton}>
            <Feather name="arrow-left" size={16} color={theme.colors.primary} />
            <Text style={styles.backButtonText}>Back to festivals</Text>
          </Pressable>
        </Link>

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.emptyTitle}>Loading festival</Text>
            <Text style={styles.emptyText}>
              The app is requesting the selected festival from the backend.
            </Text>
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Could not load festival</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : null}

        {!loading && !error && festival ? (
          <>
            <View style={styles.headerBlock}>
              <Text style={styles.title}>{title}</Text>

              <Text style={styles.dateText}>{fullDateText}</Text>
              <Text style={styles.locationText}>{locationText}</Text>

              {websiteText ? (
                <Pressable
                  style={styles.websiteButton}
                  onPress={openOfficialWebsite}
                >
                  <Text style={styles.websiteButtonText}>
                    Visit website {Platform.OS === "web" ? "↗" : ""}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {festival.image_url ? (
              <View style={styles.heroImageWrap}>
                <Image
                  source={{ uri: festival.image_url }}
                  style={styles.heroImage}
                  resizeMode="cover"
                />
              </View>
            ) : null}

            <View style={styles.contentGrid}>
              <View style={styles.mainCard}>
                <Text style={styles.sectionTitle}>About this festival</Text>
                <Text style={styles.descriptionText}>{descriptionText}</Text>
              </View>

              <View style={styles.sideCard}>
                <Text style={styles.sideTitle}>Festival details</Text>

                <DetailRow label="Name" value={title} />
                <DetailRow label="City" value={normaliseString(festival.city)} />
                <DetailRow
                  label="Country"
                  value={normaliseString(festival.country)}
                />
                <DetailRow label="Date" value={fullDateText} />
                <DetailRow label="Month" value={monthText} />
                <DetailRow label="Art Form" value={artFormText} />
                <DetailRow label="Website" value={websiteText} />
              </View>
            </View>
          </>
        ) : null}
      </View>

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scrollContent: {
    flexGrow: 1,
  },

  page: {
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },

  backButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  backButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },

  emptyState: {
    marginTop: 18,
    padding: 18,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },

  emptyTitle: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 18,
    marginTop: 14,
  },

  emptyText: {
    color: theme.colors.textMuted,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 700,
  },

  headerBlock: {
    marginTop: 18,
  },

  title: {
    color: theme.colors.primary,
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "900",
    maxWidth: 900,
  },

  dateText: {
    marginTop: 14,
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "800",
  },

  locationText: {
    marginTop: 2,
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "800",
  },

  websiteButton: {
    alignSelf: "flex-start",
    marginTop: 22,
    backgroundColor: "#099f95",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
  },

  websiteButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },

  heroImageWrap: {
    marginTop: 24,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  heroImage: {
    width: "100%",
    height: Platform.OS === "web" ? 420 : 240,
    backgroundColor: theme.colors.surfaceSoft,
  },

  contentGrid: {
    marginTop: 24,
    gap: 20,
    flexDirection: Platform.OS === "web" ? "row" : "column",
    alignItems: "flex-start",
  },

  mainCard: {
    flex: Platform.OS === "web" ? 1.7 : undefined,
    width: Platform.OS === "web" ? undefined : "100%",
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 22,
  },

  sideCard: {
    flex: Platform.OS === "web" ? 1 : undefined,
    width: Platform.OS === "web" ? undefined : "100%",
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 22,
  },

  sectionTitle: {
    color: theme.colors.primary,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
  },

  descriptionText: {
    marginTop: 16,
    color: theme.colors.text,
    fontSize: 18,
    lineHeight: 34,
    letterSpacing: 0.2,
  },

  sideTitle: {
    color: theme.colors.primary,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900",
  },

  detailRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  detailLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  detailValue: {
    marginTop: 6,
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
  },
});