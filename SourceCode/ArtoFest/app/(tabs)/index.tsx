import React, { useMemo, useState } from "react";
import {
  FlatList,
  ImageBackground,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import rawFestivals from "../../data/festivals.json";

type Festival = {
  COUNTRY?: string;
  NAME?: string;
  PLACE?: string;
  TIME?: string | number;
  "ART/GENRE"?: string;
  WEB?: string;
};

// Helper functions used to normalise data coming from Excel
function normaliseString(v: unknown) {
  return String(v ?? "").trim();
}

function safeWebUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

// Hero background image (can be swapped during design iteration)
const HERO_IMAGE = require("../../assets/images/hero.png");

export default function HomeSearchScreen() {
  // Clean and prepare festival data for use in the app
  const festivals: Festival[] = useMemo(() => {
    return (rawFestivals as Festival[])
      .filter((f) => f && (f.NAME || f.COUNTRY || f.PLACE || f.WEB))
      .map((f) => ({
        COUNTRY: normaliseString(f.COUNTRY),
        NAME: normaliseString(f.NAME),
        PLACE: normaliseString(f.PLACE),
        TIME: f.TIME ?? "",
        "ART/GENRE": normaliseString((f as any)["ART/GENRE"]),
        WEB: normaliseString(f.WEB),
      }));
  }, []);

  // Search input state
  const [nameQuery, setNameQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [genreQuery, setGenreQuery] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");

  // Used to control when results are displayed
  const [hasSearched, setHasSearched] = useState(false);

  // Ensures at least one filter is selected before showing results
  const atLeastOneParamSelected = useMemo(() => {
    return (
      nameQuery.trim().length > 0 ||
      countryQuery.trim().length > 0 ||
      genreQuery.trim().length > 0 ||
      placeQuery.trim().length > 0
    );
  }, [nameQuery, countryQuery, genreQuery, placeQuery]);

  // Apply search filters to the festival list
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

  // Simple featured list shown when no search is active
  const featured = useMemo(() => {
    return festivals.slice(0, 8);
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
    return (
      <View style={styles.resultCard}>
        <Text style={styles.resultName}>{item.NAME || "Unnamed festival"}</Text>

        <Text style={styles.resultMeta}>
          {item.COUNTRY ? item.COUNTRY : "Unknown country"}
          {item.PLACE ? ` • ${item.PLACE}` : ""}
        </Text>

        {String(item.TIME ?? "").trim().length > 0 ? (
          <Text style={styles.resultMeta}>Time: {String(item.TIME)}</Text>
        ) : null}

        {(item as any)["ART/GENRE"] ? (
          <Text style={styles.genreChip}>{(item as any)["ART/GENRE"]}</Text>
        ) : null}

        {web ? (
          <Pressable style={styles.linkBtn} onPress={() => openWebsite(web)}>
            <Text style={styles.linkBtnText}>
              Open website {Platform.OS === "web" ? "↗" : ""}
            </Text>
          </Pressable>
        ) : null}
      </View>
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
            {/* Hero section */}
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

            {/* Informational panel */}
            <View style={styles.essential}>
              <Text style={styles.essentialTitle}>
                What makes ArtoFest essential?
              </Text>
              <Text style={styles.essentialText}>
                You can browse festivals with detailed profiles and curated
                information — quickly, in one place.
              </Text>
            </View>

            {/* Search interface */}
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
                placeholderTextColor="#7a7a7a"
              />

              <Text style={styles.label}>Country</Text>
              <TextInput
                value={countryQuery}
                onChangeText={setCountryQuery}
                placeholder="e.g. Germany"
                style={styles.input}
                placeholderTextColor="#7a7a7a"
              />

              <Text style={styles.label}>Art / Genre</Text>
              <TextInput
                value={genreQuery}
                onChangeText={setGenreQuery}
                placeholder="e.g. Music, Cinema, Theatre"
                style={styles.input}
                placeholderTextColor="#7a7a7a"
              />

              <Text style={styles.label}>Place / City</Text>
              <TextInput
                value={placeQuery}
                onChangeText={setPlaceQuery}
                placeholder="e.g. Berlin"
                style={styles.input}
                placeholderTextColor="#7a7a7a"
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

            {/* User feedback when search is invalid */}
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

            {/* Featured content shown before searching */}
            {!hasSearched ? (
              <View style={styles.featuredWrap}>
                <Text style={styles.sectionTitle}>Featured festivals</Text>
                <Text style={styles.sectionSubtitle}>
                  A quick starting point — use Search to filter properly.
                </Text>

                <View style={styles.featuredGrid}>
                  {featured.map((f, idx) => (
                    <View
                      key={`${f.NAME ?? "feat"}-${idx}`}
                      style={styles.featuredCard}
                    >
                      <Text style={styles.featuredName} numberOfLines={2}>
                        {f.NAME || "Unnamed festival"}
                      </Text>
                      <Text style={styles.featuredMeta} numberOfLines={1}>
                        {(f.COUNTRY || "Unknown") +
                          (f.PLACE ? ` • ${f.PLACE}` : "")}
                      </Text>

                      {(f as any)["ART/GENRE"] ? (
                        <Text style={styles.featuredChip} numberOfLines={1}>
                          {(f as any)["ART/GENRE"]}
                        </Text>
                      ) : null}

                      {f.WEB ? (
                        <Pressable
                          style={styles.featuredBtn}
                          onPress={() => openWebsite(f.WEB ?? "")}
                        >
                          <Text style={styles.featuredBtnText}>
                            Open {Platform.OS === "web" ? "↗" : ""}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          hasSearched && atLeastOneParamSelected ? (
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
  screen: { flex: 1, backgroundColor: "#0b0b0f" },

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
    borderColor: "#23232c",
    backgroundColor: "#14141a",
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
    color: "white",
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
    backgroundColor: "#6d57ff",
  },
  essentialTitle: { color: "white", fontSize: 22, fontWeight: "900" },
  essentialText: { marginTop: 8, color: "white", opacity: 0.95, lineHeight: 20 },

  title: { fontSize: 26, fontWeight: "800", color: "white", marginTop: 16 },
  subtitle: { marginTop: 6, color: "#cfcfcf" },

  card: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#14141a",
    borderWidth: 1,
    borderColor: "#23232c",
  },
  label: {
    marginTop: 10,
    marginBottom: 6,
    color: "#e6e6e6",
    fontWeight: "600",
  },
  input: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: "#0f0f14",
    borderWidth: 1,
    borderColor: "#2a2a35",
    color: "white",
  },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6d57ff",
  },
  primaryBtnText: { color: "white", fontWeight: "800" },
  secondaryBtn: {
    width: 110,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#23232c",
    borderWidth: 1,
    borderColor: "#2f2f3b",
  },
  secondaryBtnText: { color: "white", fontWeight: "700" },

  emptyState: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#14141a",
    borderWidth: 1,
    borderColor: "#23232c",
  },
  emptyTitle: { color: "white", fontWeight: "800", fontSize: 16 },
  emptyText: { color: "#cfcfcf", marginTop: 6 },

  resultsHeader: { marginTop: 14, marginBottom: 8 },
  resultsTitle: { color: "white", fontWeight: "800", fontSize: 16 },

  resultCard: {
    marginTop: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#14141a",
    borderWidth: 1,
    borderColor: "#23232c",
  },
  resultName: { color: "white", fontWeight: "900", fontSize: 16 },
  resultMeta: { color: "#cfcfcf", marginTop: 4 },
  genreChip: {
    marginTop: 10,
    alignSelf: "flex-start",
    color: "white",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#23232c",
    overflow: "hidden",
    fontWeight: "700",
  },
  linkBtn: {
    marginTop: 12,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#23232c",
    borderWidth: 1,
    borderColor: "#2f2f3b",
  },
  linkBtnText: { color: "white", fontWeight: "800" },

  featuredWrap: { marginTop: 18 },
  sectionTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  sectionSubtitle: { marginTop: 6, color: "#cfcfcf" },

  featuredGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  featuredCard: {
    width: "48%",
    minHeight: 140,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#14141a",
    borderWidth: 1,
    borderColor: "#23232c",
  },
  featuredName: { color: "white", fontWeight: "900" },
  featuredMeta: { marginTop: 6, color: "#cfcfcf", fontSize: 12 },
  featuredChip: {
    marginTop: 10,
    alignSelf: "flex-start",
    color: "white",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#23232c",
    overflow: "hidden",
    fontWeight: "700",
    fontSize: 12,
  },
  featuredBtn: {
    marginTop: 10,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#23232c",
    borderWidth: 1,
    borderColor: "#2f2f3b",
  },
  featuredBtnText: { color: "white", fontWeight: "800", fontSize: 12 },
});
