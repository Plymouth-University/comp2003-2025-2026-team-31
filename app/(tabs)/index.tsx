import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { API_BASE_URL } from "../../lib/api";
import { theme } from "../../lib/theme";

type Festival = {
  COUNTRY?: string;
  NAME?: string;
  PLACE?: string;
  TIME?: string | number;
  "ART/GENRE"?: string;
  WEB?: string;
  IMAGE_URL?: string;
};

type ApiFestival = {
  id?: number;
  country?: string | null;
  name?: string | null;
  city?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  month_text?: string | null;
  website?: string | null;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  art_form_id?: number | null;
  art_form?: string | null;
};

function normaliseString(v: unknown) {
  return String(v ?? "").trim();
}

function safeWebUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function formatFestivalTime(
  startDate?: string | null,
  endDate?: string | null,
  monthText?: string | null
) {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const startDay = start.getUTCDate();
      const endDay = end.getUTCDate();

      const sameMonth =
        start.getUTCMonth() === end.getUTCMonth() &&
        start.getUTCFullYear() === end.getUTCFullYear();

      if (sameMonth) {
        const month = start.toLocaleString("en-GB", {
          month: "short",
          timeZone: "UTC",
        });
        return `${startDay}-${endDay} ${month}`;
      }

      const startMonth = start.toLocaleString("en-GB", {
        month: "short",
        timeZone: "UTC",
      });

      const endMonth = end.toLocaleString("en-GB", {
        month: "short",
        timeZone: "UTC",
      });

      return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
    }
  }

  if (monthText && String(monthText).trim()) {
    return String(monthText).trim();
  }

  return "";
}

function mapApiFestivalToFrontendFestival(item: ApiFestival): Festival {
  return {
    COUNTRY: normaliseString(item.country),
    NAME: normaliseString(item.name),
    PLACE: normaliseString(item.city),
    TIME: formatFestivalTime(item.start_date, item.end_date, item.month_text),
    "ART/GENRE": normaliseString(item.art_form),
    WEB: normaliseString(item.website),
    IMAGE_URL: normaliseString(item.image_url),
  };
}

const HERO_IMAGE = require("../../assets/images/hero.png");

export default function HomeSearchScreen() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [nameQuery, setNameQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [genreQuery, setGenreQuery] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");

  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    async function loadFestivals() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/festivals`);

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("API did not return an array");
        }

        const cleanedFestivals = data
          .map((item: ApiFestival) => mapApiFestivalToFrontendFestival(item))
          .filter((f: Festival) => f && (f.NAME || f.COUNTRY || f.PLACE || f.WEB));

        setFestivals(cleanedFestivals);
      } catch (err) {
        console.error("Failed to load festivals:", err);
        setError("Failed to load festivals from the server.");
      } finally {
        setLoading(false);
      }
    }

    loadFestivals();
  }, []);

  const atLeastOneParamSelected = useMemo(() => {
    return (
      nameQuery.trim().length > 0 ||
      countryQuery.trim().length > 0 ||
      genreQuery.trim().length > 0 ||
      placeQuery.trim().length > 0
    );
  }, [nameQuery, countryQuery, genreQuery, placeQuery]);

  const results = useMemo(() => {
    if (!hasSearched) return [];
    if (!atLeastOneParamSelected) return [];

    const n = nameQuery.trim().toLowerCase();
    const c = countryQuery.trim().toLowerCase();
    const g = genreQuery.trim().toLowerCase();
    const p = placeQuery.trim().toLowerCase();

    return festivals.filter((f) => {
      const name = (f.NAME ?? "").toLowerCase();
      const country = (f.COUNTRY ?? "").toLowerCase();
      const genre = ((f as any)["ART/GENRE"] ?? "").toLowerCase();
      const place = (f.PLACE ?? "").toLowerCase();

      if (n && !name.includes(n)) return false;
      if (c && !country.includes(c)) return false;
      if (g && !genre.includes(g)) return false;
      if (p && !place.includes(p)) return false;

      return true;
    });
  }, [
    festivals,
    hasSearched,
    atLeastOneParamSelected,
    nameQuery,
    countryQuery,
    genreQuery,
    placeQuery,
  ]);

  const featured = useMemo(() => {
    return festivals.slice(0, 6);
  }, [festivals]);

  function onPressSearch() {
    setHasSearched(true);
  }

  function onClear() {
    setNameQuery("");
    setCountryQuery("");
    setGenreQuery("");
    setPlaceQuery("");
    setHasSearched(false);
  }

  async function openWebsite(urlRaw: string) {
    const url = safeWebUrl(urlRaw);
    if (!url) return;
    await Linking.openURL(url);
  }

  function FestivalCard({ item }: { item: Festival }) {
    const web = item.WEB ?? "";
    const locationText =
      [item.PLACE, item.COUNTRY].filter(Boolean).join(", ") || "Location TBC";

    const timeText =
      String(item.TIME ?? "").trim().length > 0
        ? `Next edition: ${String(item.TIME)}`
        : "Next edition: TBC";

    return (
      <Pressable
        style={styles.searchImageCard}
        onPress={() => {
          if (web) {
            openWebsite(web);
          }
        }}
      >
        {item.IMAGE_URL ? (
          <Image
            source={{ uri: item.IMAGE_URL }}
            style={styles.searchImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.searchImageFallback}>
            <Text style={styles.searchImageFallbackText}>No image</Text>
          </View>
        )}

        <View style={styles.searchImageCardBody}>
          <Text style={styles.searchImageTitle} numberOfLines={2}>
            {item.NAME || "Unnamed festival"}
          </Text>

          <Text style={styles.searchImageLocation} numberOfLines={1}>
            {locationText}
          </Text>

          <Text style={styles.searchImageDate} numberOfLines={1}>
            {timeText}
          </Text>

          {(item as any)["ART/GENRE"] ? (
            <Text style={styles.searchGenreChip} numberOfLines={1}>
              {(item as any)["ART/GENRE"]}
            </Text>
          ) : null}

          {web ? (
            <View style={styles.searchLinkBtn}>
              <Text style={styles.searchLinkBtnText}>
                Open website {Platform.OS === "web" ? "↗" : ""}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={hasSearched && atLeastOneParamSelected ? results : []}
        keyExtractor={(item, index) => `${item.NAME ?? "festival"}-${index}`}
        contentContainerStyle={styles.pageContainer}
        renderItem={({ item }) => <FestivalCard item={item} />}
        ListHeaderComponent={
          <View>
            <View style={styles.heroWrap}>
              <ImageBackground
                source={HERO_IMAGE}
                resizeMode="cover"
                style={styles.hero}
                imageStyle={styles.heroImage}
              >
                <View style={styles.heroOverlay} />
                <View style={styles.heroContent}>
                  <Text style={styles.heroTitle}>
                    Plan your{"\n"}festival{"\n"}season{"\n"}like a writer
                  </Text>

                  <Text style={styles.heroBody}>
                    ArtoFest guides you through every festival worth attending.
                    {"\n"}
                    Build your schedule, discover new art forms, and never miss a
                    moment that matters.
                  </Text>
                </View>

                <View style={styles.heroDivider} />
              </ImageBackground>
            </View>

            <View style={styles.essential}>
              <Text style={styles.essentialTitle}>
                What makes ArtoFest essential?
              </Text>
              <Text style={styles.essentialText}>
                You can browse festivals with detailed profiles and curated
                information — quickly, in one place.
              </Text>
            </View>

            <Text style={styles.title}>Find a festival</Text>
            <Text style={styles.subtitle}>
              Search by at least one filter, then press Search.
            </Text>

            <View style={styles.card}>
              <Text style={styles.label}>Festival name</Text>
              <TextInput
                value={nameQuery}
                onChangeText={setNameQuery}
                placeholder="e.g. Berlinale"
                style={styles.input}
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={styles.label}>Country</Text>
              <TextInput
                value={countryQuery}
                onChangeText={setCountryQuery}
                placeholder="e.g. Germany"
                style={styles.input}
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={styles.label}>Art / Genre</Text>
              <TextInput
                value={genreQuery}
                onChangeText={setGenreQuery}
                placeholder="e.g. Music, Cinema, Theatre"
                style={styles.input}
                placeholderTextColor={theme.colors.textMuted}
              />

              <Text style={styles.label}>Place / City</Text>
              <TextInput
                value={placeQuery}
                onChangeText={setPlaceQuery}
                placeholder="e.g. Berlin"
                style={styles.input}
                placeholderTextColor={theme.colors.textMuted}
              />

              <View style={styles.buttonRow}>
                <Pressable style={styles.secondaryBtn} onPress={onClear}>
                  <Text style={styles.secondaryBtnText}>Clear</Text>
                </Pressable>

                <Pressable style={styles.primaryBtn} onPress={onPressSearch}>
                  <Text style={styles.primaryBtnText}>Search</Text>
                </Pressable>
              </View>
            </View>

            {loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Loading festivals</Text>
                <Text style={styles.emptyText}>
                  The app is requesting festival data from the backend.
                </Text>
              </View>
            ) : null}

            {!loading && error ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Could not load festivals</Text>
                <Text style={styles.emptyText}>{error}</Text>
              </View>
            ) : null}

            {hasSearched && !atLeastOneParamSelected ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No filters selected</Text>
                <Text style={styles.emptyText}>
                  Choose at least one filter above, then press Search again.
                </Text>
              </View>
            ) : null}

            {hasSearched && atLeastOneParamSelected ? (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>Results: {results.length}</Text>
              </View>
            ) : null}

            {!hasSearched && !loading ? (
              <View style={styles.featuredWrap}>
                <Text style={styles.sectionTitle}>Featured festivals</Text>
                <Text style={styles.sectionSubtitle}>
                  A quick starting point — use Search to filter properly.
                </Text>

                <View style={styles.featuredGrid}>
                  {featured.map((f, idx) => {
                    const locationText =
                      [f.PLACE, f.COUNTRY].filter(Boolean).join(", ") ||
                      "Location TBC";

                    const nextEditionText =
                      String(f.TIME ?? "").trim().length > 0
                        ? `Next edition: ${String(f.TIME)}`
                        : "Next edition: TBC";

                    return (
                      <Pressable
                        key={`${f.NAME ?? "feat"}-${idx}`}
                        style={styles.featuredImageCard}
                        onPress={() => {
                          if (f.WEB) {
                            openWebsite(f.WEB);
                          }
                        }}
                      >
                        {f.IMAGE_URL ? (
                          <Image
                            source={{ uri: f.IMAGE_URL }}
                            style={styles.featuredImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.featuredImageFallback}>
                            <Text style={styles.featuredImageFallbackText}>
                              No image
                            </Text>
                          </View>
                        )}

                        <View style={styles.featuredImageCardBody}>
                          <Text style={styles.featuredImageTitle} numberOfLines={2}>
                            {f.NAME || "Unnamed festival"}
                          </Text>

                          <Text
                            style={styles.featuredImageLocation}
                            numberOfLines={1}
                          >
                            {locationText}
                          </Text>

                          <Text style={styles.featuredImageDate} numberOfLines={1}>
                            {nextEditionText}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          hasSearched && atLeastOneParamSelected && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No matches</Text>
              <Text style={styles.emptyText}>
                Try a broader search (shorter name, remove a filter, etc.).
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },

  pageContainer: {
    padding: 16,
    paddingBottom: 40,
    alignSelf: "center",
    width: "100%",
    maxWidth: 980,
  },

  heroWrap: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  hero: {
    minHeight: Platform.OS === "web" ? 340 : 260,
    padding: 18,
    justifyContent: "flex-end",
  },
  heroImage: {
    borderRadius: 18,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  heroContent: {
    position: "relative",
  },
  heroTitle: {
    color: theme.colors.surface,
    fontWeight: "900",
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroBody: {
    marginTop: 12,
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 520,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroDivider: {
    marginTop: 14,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  essential: {
    marginTop: 0,
    borderRadius: 18,
    padding: 18,
    backgroundColor: theme.colors.primary,
  },
  essentialTitle: {
    color: theme.colors.surface,
    fontSize: 22,
    fontWeight: "900",
  },
  essentialText: {
    marginTop: 8,
    color: theme.colors.surface,
    opacity: 0.95,
    lineHeight: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.primary,
    marginTop: 16,
  },
  subtitle: { marginTop: 6, color: theme.colors.textMuted },

  card: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: theme.colors.text,
    fontWeight: "600",
  },
  input: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
  },
  primaryBtnText: { color: theme.colors.surface, fontWeight: "800" },
  secondaryBtn: {
    width: 110,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryBtnText: { color: theme.colors.textMuted, fontWeight: "700" },

  emptyState: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyTitle: { color: theme.colors.primary, fontWeight: "800", fontSize: 16 },
  emptyText: { color: theme.colors.textMuted, marginTop: 6 },

  resultsHeader: { marginTop: 14, marginBottom: 8 },
  resultsTitle: { color: theme.colors.primary, fontWeight: "800", fontSize: 16 },

  resultCard: {
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  resultName: { color: theme.colors.text, fontWeight: "900", fontSize: 16 },
  resultMeta: { color: theme.colors.textMuted, marginTop: 4 },
  genreChip: {
    marginTop: 10,
    alignSelf: "flex-start",
    color: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    overflow: "hidden",
    fontWeight: "700",
  },
  linkBtn: {
    marginTop: 12,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  linkBtnText: { color: theme.colors.surface, fontWeight: "800" },

  featuredWrap: { marginTop: 18 },
  sectionTitle: { color: theme.colors.primary, fontSize: 18, fontWeight: "900" },
  sectionSubtitle: { marginTop: 6, color: theme.colors.textMuted },

  featuredGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  featuredImageCard: {
    width: Platform.OS === "web" ? "31.8%" : "48%",
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  featuredImage: {
    width: "100%",
    height: 210,
    backgroundColor: "#ddd",
  },

  featuredImageFallback: {
    width: "100%",
    height: 210,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  featuredImageFallbackText: {
    color: theme.colors.textMuted,
    fontWeight: "700",
  },

  featuredImageCardBody: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 14,
  },

  featuredImageTitle: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  featuredImageLocation: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "600",
  },

  featuredImageDate: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontStyle: "italic",
  },

  searchImageCard: {
    marginTop: 12,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  searchImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#ddd",
  },

  searchImageFallback: {
    width: "100%",
    height: 220,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  searchImageFallbackText: {
    color: theme.colors.textMuted,
    fontWeight: "700",
  },

  searchImageCardBody: {
    padding: 14,
  },

  searchImageTitle: {
    color: theme.colors.text,
    fontWeight: "900",
    fontSize: 18,
  },

  searchImageLocation: {
    color: theme.colors.textMuted,
    marginTop: 6,
    fontSize: 14,
  },

  searchImageDate: {
    color: theme.colors.textMuted,
    marginTop: 4,
    fontSize: 13,
    fontStyle: "italic",
  },

  searchGenreChip: {
    marginTop: 10,
    alignSelf: "flex-start",
    color: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
    overflow: "hidden",
    fontWeight: "700",
  },

  searchLinkBtn: {
    marginTop: 12,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },

  searchLinkBtnText: {
    color: theme.colors.surface,
    fontWeight: "800",
  },
});
