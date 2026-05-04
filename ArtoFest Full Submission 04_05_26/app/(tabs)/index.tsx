import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
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
  MONTH_ORDER,
  buildFestivalLocation,
  fetchFestivals,
  formatFestivalTime,
  normaliseMonth,
  normaliseString,
  toNumericId,
} from "../../lib/festivals";
import { theme } from "../../lib/theme";

type DropdownKey = "country" | "month" | "artForm" | null;

const HERO_IMAGE = require("../../assets/images/hero.png");

function DropdownField({
  label,
  value,
  placeholder,
  options,
  isOpen,
  onToggle,
  onSelect,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={[styles.filterField, isOpen ? styles.filterFieldOpen : null]}>
      <Text style={styles.srOnly}>{label}</Text>

      <Pressable style={styles.filterTrigger} onPress={onToggle}>
        <Text
          style={[
            styles.filterTriggerText,
            !value ? styles.filterPlaceholderText : null,
          ]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>

        <Text style={styles.filterChevron}>{isOpen ? "▲" : "▼"}</Text>
      </Pressable>

      {isOpen ? (
        <View style={styles.dropdownMenu}>
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={styles.dropdownScroll}
          >
            <Pressable
              style={styles.dropdownOption}
              onPress={() => onSelect("")}
            >
              <Text style={styles.dropdownOptionText}>Any</Text>
            </Pressable>

            {options.map((option) => (
              <Pressable
                key={option}
                style={styles.dropdownOption}
                onPress={() => onSelect(option)}
              >
                <Text style={styles.dropdownOptionText}>{option}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function FestivalCard({
  item,
  onPress,
}: {
  item: FestivalRecord;
  onPress: () => void;
}) {
  const locationText = buildFestivalLocation(item) || "Location TBC";
  const timeText =
    formatFestivalTime(item.start_date, item.end_date, item.month_text) ||
    "TBC";

  return (
    <Pressable style={styles.searchImageCard} onPress={onPress}>
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
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
          {item.name || "Unnamed festival"}
        </Text>

        <Text style={styles.searchImageLocation} numberOfLines={1}>
          {locationText}
        </Text>

        <Text style={styles.searchImageDate} numberOfLines={1}>
          Next edition: {timeText}
        </Text>

        {normaliseString(item.art_form) ? (
          <Text style={styles.searchGenreChip} numberOfLines={1}>
            {normaliseString(item.art_form)}
          </Text>
        ) : null}

        <View style={styles.searchLinkBtn}>
          <Text style={styles.searchLinkBtnText}>View details</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeSearchScreen() {
  const router = useRouter();

  const [festivals, setFestivals] = useState<FestivalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedArtForm, setSelectedArtForm] = useState("");

  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    async function loadFestivals() {
      try {
        setLoading(true);
        setError("");

        const response = await fetchFestivals();

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("API did not return an array");
        }

        const cleanedFestivals = data
          .map((item: FestivalRecord) => ({
            id: toNumericId(item.id),
            name: normaliseString(item.name),
            city: normaliseString(item.city),
            country: normaliseString(item.country),
            image_url: normaliseString(item.image_url),
            website: normaliseString(item.website),
            start_date: item.start_date ?? null,
            end_date: item.end_date ?? null,
            month_text: normaliseString(item.month_text),
            art_form: normaliseString(item.art_form),
            description: normaliseString(item.description),
            latitude: item.latitude ?? null,
            longitude: item.longitude ?? null,
          }))
          .filter(
            (festival: FestivalRecord) =>
              typeof festival.id === "number" && Number.isFinite(festival.id)
          );

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

  const countryOptions = useMemo(() => {
    return Array.from(
      new Set(festivals.map((f) => normaliseString(f.country)).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [festivals]);

  const monthOptions = useMemo(() => {
    const uniqueMonths = new Set(
      festivals
        .map((f) => normaliseMonth(f.month_text, f.start_date))
        .filter(Boolean)
    );

    return MONTH_ORDER.filter((month) => uniqueMonths.has(month));
  }, [festivals]);

  const artFormOptions = useMemo(() => {
    return Array.from(
      new Set(festivals.map((f) => normaliseString(f.art_form)).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [festivals]);

  const atLeastOneParamSelected = useMemo(() => {
    return (
      selectedCountry.trim().length > 0 ||
      selectedMonth.trim().length > 0 ||
      selectedArtForm.trim().length > 0
    );
  }, [selectedCountry, selectedMonth, selectedArtForm]);

  const results = useMemo(() => {
    if (!hasSearched) return [];
    if (!atLeastOneParamSelected) return [];

    return festivals.filter((festival) => {
      const country = normaliseString(festival.country).toLowerCase();
      const month = normaliseMonth(
        festival.month_text,
        festival.start_date
      ).toLowerCase();
      const artForm = normaliseString(festival.art_form).toLowerCase();

      if (selectedCountry && country !== selectedCountry.trim().toLowerCase()) {
        return false;
      }

      if (selectedMonth && month !== selectedMonth.trim().toLowerCase()) {
        return false;
      }

      if (selectedArtForm && artForm !== selectedArtForm.trim().toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [
    festivals,
    hasSearched,
    atLeastOneParamSelected,
    selectedCountry,
    selectedMonth,
    selectedArtForm,
  ]);

  const featured = useMemo(() => festivals.slice(0, 6), [festivals]);

  function onPressSearch() {
    setOpenDropdown(null);
    setHasSearched(true);
  }

  function onClear() {
    setSelectedCountry("");
    setSelectedMonth("");
    setSelectedArtForm("");
    setOpenDropdown(null);
    setHasSearched(false);
  }

  function openFestivalDetail(festival: FestivalRecord) {
    if (typeof festival.id !== "number" || !Number.isFinite(festival.id)) {
      console.log("Festival has invalid id:", festival);
      return;
    }

    router.push({
      pathname: "/festival/[id]",
      params: { id: String(festival.id) },
    });
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
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
              Discover{"\n"}festivals worth{"\n"}travelling for
            </Text>

            <Text style={styles.heroBody}>
              Find the right festivals, build your itinerary, and keep every
              important detail in one place from discovery to departure.
            </Text>
          </View>

          <View style={styles.heroDivider} />
        </ImageBackground>
      </View>

      <View style={styles.page}>
        <View style={styles.searchHeader}>
          <Text style={styles.title}>Find a festival</Text>
          <Text style={styles.subtitle}>
            Choose at least one filter, then press Search.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.filterBar}>
            <DropdownField
              label="Country"
              value={selectedCountry}
              placeholder="Countries"
              options={countryOptions}
              isOpen={openDropdown === "country"}
              onToggle={() =>
                setOpenDropdown((current) =>
                  current === "country" ? null : "country"
                )
              }
              onSelect={(value) => {
                setSelectedCountry(value);
                setOpenDropdown(null);
              }}
            />

            <DropdownField
              label="Month"
              value={selectedMonth}
              placeholder="Month"
              options={monthOptions}
              isOpen={openDropdown === "month"}
              onToggle={() =>
                setOpenDropdown((current) =>
                  current === "month" ? null : "month"
                )
              }
              onSelect={(value) => {
                setSelectedMonth(value);
                setOpenDropdown(null);
              }}
            />

            <DropdownField
              label="Art Form"
              value={selectedArtForm}
              placeholder="Art Form"
              options={artFormOptions}
              isOpen={openDropdown === "artForm"}
              onToggle={() =>
                setOpenDropdown((current) =>
                  current === "artForm" ? null : "artForm"
                )
              }
              onSelect={(value) => {
                setSelectedArtForm(value);
                setOpenDropdown(null);
              }}
            />

            <Pressable style={styles.searchButton} onPress={onPressSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </Pressable>

            <Pressable style={styles.clearBtn} onPress={onClear}>
              <Text style={styles.clearBtnText}>Clear filters</Text>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Loading festivals</Text>
            <Text style={styles.emptyText}>
              The app is requesting festival data from the server.
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

        {hasSearched &&
        atLeastOneParamSelected &&
        !loading &&
        results.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptyText}>
              Try a broader search by removing one of the filters.
            </Text>
          </View>
        ) : null}

        {hasSearched && atLeastOneParamSelected
          ? results.map((item) => (
              <FestivalCard
                key={String(item.id)}
                item={item}
                onPress={() => openFestivalDetail(item)}
              />
            ))
          : null}

        {!hasSearched && !loading ? (
          <View style={styles.featuredWrap}>
            <Text style={styles.sectionTitle}>Featured festivals</Text>
            <Text style={styles.sectionSubtitle}>
              A quick starting point — use Search to filter properly.
            </Text>

            <View style={styles.featuredGrid}>
              {featured.map((festival) => {
                const locationText =
                  buildFestivalLocation(festival) || "Location TBC";

                const nextEditionText =
                  formatFestivalTime(
                    festival.start_date,
                    festival.end_date,
                    festival.month_text
                  ) || "TBC";

                return (
                  <Pressable
                    key={String(festival.id)}
                    style={styles.featuredImageCard}
                    onPress={() => openFestivalDetail(festival)}
                  >
                    {festival.image_url ? (
                      <Image
                        source={{ uri: festival.image_url }}
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
                        {festival.name || "Unnamed festival"}
                      </Text>

                      <Text
                        style={styles.featuredImageLocation}
                        numberOfLines={1}
                      >
                        {locationText}
                      </Text>

                      <Text style={styles.featuredImageDate} numberOfLines={1}>
                        Next edition: {nextEditionText}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
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
    maxWidth: 1980,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    position: "relative",
    zIndex: 50,
  },

  heroWrap: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#000000",
    position: "relative",
    zIndex: 1,
  },

  hero: {
    width: "100%",
    minHeight: Platform.OS === "web" ? 500 : 360,
    paddingHorizontal: Platform.OS === "web" ? 80 : 24,
    paddingVertical: Platform.OS === "web" ? 58 : 34,
    justifyContent: "flex-end",
    overflow: "hidden",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  heroContent: {
    position: "relative",
    width: "100%",
    maxWidth: 1980,
    alignSelf: "center",
  },

  heroTitle: {
    color: theme.colors.surface,
    fontWeight: "900",
    fontSize: Platform.OS === "web" ? 56 : 36,
    lineHeight: Platform.OS === "web" ? 60 : 40,
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  heroBody: {
    marginTop: 16,
    color: "rgba(255,255,255,0.92)",
    fontSize: Platform.OS === "web" ? 16 : 14,
    lineHeight: Platform.OS === "web" ? 24 : 20,
    maxWidth: 590,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  heroDivider: {
    width: "100%",
    maxWidth: 1980,
    alignSelf: "center",
    marginTop: 22,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  searchHeader: {
    marginTop: 0,
  },

  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    color: theme.colors.primary,
  },

  subtitle: {
    marginTop: 6,
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },

  card: {
    marginTop: 14,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "visible",
    position: "relative",
    zIndex: 5000,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  filterBar: {
    flexDirection: "row",
    flexWrap: Platform.OS === "web" ? "nowrap" : "wrap",
    alignItems: "center",
    gap: 10,
  },

  filterField: {
    flex: Platform.OS === "web" ? 1 : 0,
    width: Platform.OS === "web" ? undefined : "100%",
    minWidth: Platform.OS === "web" ? 0 : "100%",
    position: "relative",
    zIndex: 1,
  },

  filterFieldOpen: {
    zIndex: 9999,
    elevation: 9999,
  },

  filterTrigger: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSoft,
    justifyContent: "center",
    paddingLeft: 16,
    paddingRight: 42,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  filterTriggerText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },

  filterPlaceholderText: {
    color: theme.colors.primary,
    fontWeight: "800",
  },

  filterChevron: {
    position: "absolute",
    right: 14,
    top: 17,
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },

  dropdownMenu: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 9999,
    zIndex: 9999,
    maxHeight: 240,
    overflow: "hidden",
  },

  dropdownScroll: {
    maxHeight: 240,
  },

  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },

  dropdownOptionText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },

  searchButton: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    alignSelf: "stretch",
    minWidth: Platform.OS === "web" ? 120 : "100%",
    width: Platform.OS === "web" ? undefined : "100%",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  searchButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },

  clearBtn: {
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: Platform.OS === "web" ? undefined : "100%",
    width: Platform.OS === "web" ? undefined : "100%",
  },

  clearBtnText: {
    color: theme.colors.primary,
    fontWeight: "800",
  },

  emptyState: {
    marginTop: 14,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  emptyTitle: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 18,
  },

  emptyText: {
    color: theme.colors.textMuted,
    marginTop: 6,
    lineHeight: 22,
  },

  resultsHeader: {
    marginTop: 18,
    marginBottom: 8,
  },

  resultsTitle: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 18,
  },

  searchImageCard: {
    marginTop: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  searchImage: {
    width: "100%",
    height: 210,
    backgroundColor: theme.colors.surfaceSoft,
  },

  searchImageFallback: {
    width: "100%",
    height: 210,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  searchImageFallbackText: {
    color: theme.colors.textMuted,
    fontWeight: "700",
  },

  searchImageCardBody: {
    padding: 16,
  },

  searchImageTitle: {
    color: theme.colors.primary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },

  searchImageLocation: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
  },

  searchImageDate: {
    marginTop: 6,
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },

  searchGenreChip: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: theme.colors.surfaceSoft,
    color: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "800",
    fontSize: 13,
  },

  searchLinkBtn: {
    alignSelf: "flex-start",
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },

  searchLinkBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14,
  },

  featuredWrap: {
    marginTop: 22,
  },

  sectionTitle: {
    color: theme.colors.primary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 6,
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },

  featuredGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  featuredImageCard: {
    width: Platform.OS === "web" ? "31.8%" : "48%",
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  featuredImage: {
    width: "100%",
    height: 160,
    backgroundColor: theme.colors.surfaceSoft,
  },

  featuredImageFallback: {
    width: "100%",
    height: 160,
    backgroundColor: theme.colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  featuredImageFallbackText: {
    color: theme.colors.textMuted,
    fontWeight: "700",
  },

  featuredImageCardBody: {
    padding: 12,
  },

  featuredImageTitle: {
    color: theme.colors.primary,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "900",
  },

  featuredImageLocation: {
    marginTop: 8,
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "700",
  },

  featuredImageDate: {
    marginTop: 5,
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },

  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});