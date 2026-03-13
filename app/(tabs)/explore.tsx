import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import FestivalMap from "../../components/FestivalMap";
import type { MappableFestival } from "../../components/FestivalMap.types";
import { API_BASE_URL } from "../../lib/api";
import { theme } from "../../lib/theme";

const INITIAL_VISIBLE_COUNTRIES = 8;

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

type Festival = {
  id: number;
  country: string;
  name: string;
  city: string;
  website: string;
  imageUrl: string;
  latitude: number | null;
  longitude: number | null;
  artForm: string;
};

type CountryGroup = {
  country: string;
  imageUrl: string;
  festivals: Festival[];
  filteredFestivals: Festival[];
  totalFestivalCount: number;
  filteredFestivalCount: number;
};

function normaliseString(value: unknown) {
  return String(value ?? "").trim();
}

function normaliseNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isValidCountry(country: string) {
  const cleaned = country.trim().toLowerCase();
  return cleaned.length > 0 && cleaned !== "various";
}

function hasValidCoordinates(festival: Festival) {
  return (
    typeof festival.latitude === "number" &&
    Number.isFinite(festival.latitude) &&
    typeof festival.longitude === "number" &&
    Number.isFinite(festival.longitude)
  );
}

function mapApiFestival(item: ApiFestival): Festival {
  return {
    id: typeof item.id === "number" ? item.id : 0,
    country: normaliseString(item.country) || "Unknown",
    name: normaliseString(item.name) || "Unnamed festival",
    city: normaliseString(item.city),
    website: normaliseString(item.website),
    imageUrl: normaliseString(item.image_url),
    latitude: normaliseNumber(item.latitude),
    longitude: normaliseNumber(item.longitude),
    artForm: normaliseString(item.art_form),
  };
}

export default function ExploreScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isLargeScreen = width >= 900;
  const isMediumScreen = width >= 600 && width < 900;

  const countryCardWidth = isLargeScreen ? "23.5%" : isMediumScreen ? "48.5%" : "100%";
  const mapWidth = isLargeScreen ? "74%" : "100%";
  const sidePanelWidth = isLargeScreen ? "23%" : "100%";

  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [countryQuery, setCountryQuery] = useState("");
  const [selectedArtForm, setSelectedArtForm] = useState("");
  const [isArtFormMenuOpen, setIsArtFormMenuOpen] = useState(false);

  const [visibleCountryCount, setVisibleCountryCount] = useState(INITIAL_VISIBLE_COUNTRIES);
  const [selectedCountry, setSelectedCountry] = useState("");

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

        const mapped = data
          .map((item: ApiFestival) => mapApiFestival(item))
          .filter((festival: Festival) => isValidCountry(festival.country));

        setFestivals(mapped);
      } catch (err) {
        console.error("Failed to load explore page data:", err);
        setError("Failed to load festival data from the server.");
      } finally {
        setLoading(false);
      }
    }

    loadFestivals();
  }, []);

  const stats = useMemo(() => {
    const countries = new Set<string>();
    const cities = new Set<string>();
    const artForms = new Set<string>();

    festivals.forEach((festival) => {
      if (festival.country) countries.add(festival.country);
      if (festival.city) cities.add(festival.city);
      if (festival.artForm) artForms.add(festival.artForm);
    });

    return {
      festivals: festivals.length,
      countries: countries.size,
      cities: cities.size,
      artForms: artForms.size,
    };
  }, [festivals]);

  const artFormOptions = useMemo(() => {
    return Array.from(
      new Set(
        festivals
          .map((festival) => festival.artForm)
          .filter((artForm) => artForm.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [festivals]);

  const allCountryGroups = useMemo(() => {
    const groups = new Map<string, CountryGroup>();

    festivals.forEach((festival) => {
      const key = festival.country;

      if (!groups.has(key)) {
        groups.set(key, {
          country: key,
          imageUrl: festival.imageUrl || "",
          festivals: [],
          filteredFestivals: [],
          totalFestivalCount: 0,
          filteredFestivalCount: 0,
        });
      }

      const group = groups.get(key)!;

      group.festivals.push(festival);
      group.totalFestivalCount = group.festivals.length;

      if (!group.imageUrl && festival.imageUrl) {
        group.imageUrl = festival.imageUrl;
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (b.totalFestivalCount !== a.totalFestivalCount) {
        return b.totalFestivalCount - a.totalFestivalCount;
      }
      return a.country.localeCompare(b.country);
    });
  }, [festivals]);

  const filteredCountryGroups = useMemo(() => {
    const query = countryQuery.trim().toLowerCase();

    return allCountryGroups
      .map((group) => {
        const filteredFestivals = group.festivals.filter((festival) => {
          if (selectedArtForm && festival.artForm !== selectedArtForm) {
            return false;
          }
          return true;
        });

        return {
          ...group,
          filteredFestivals,
          filteredFestivalCount: filteredFestivals.length,
        };
      })
      .filter((group) => {
        if (query && !group.country.toLowerCase().includes(query)) {
          return false;
        }

        if (selectedArtForm && group.filteredFestivalCount === 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (b.filteredFestivalCount !== a.filteredFestivalCount) {
          return b.filteredFestivalCount - a.filteredFestivalCount;
        }
        return a.country.localeCompare(b.country);
      });
  }, [allCountryGroups, countryQuery, selectedArtForm]);

  const visibleCountryGroups = useMemo(() => {
    return filteredCountryGroups.slice(0, visibleCountryCount);
  }, [filteredCountryGroups, visibleCountryCount]);

  const selectedCountryGroup = useMemo(() => {
    return filteredCountryGroups.find((group) => group.country === selectedCountry) || null;
  }, [filteredCountryGroups, selectedCountry]);

  const festivalsForMap = useMemo(() => {
    const sourceFestivals = selectedCountryGroup
      ? selectedCountryGroup.filteredFestivals
      : filteredCountryGroups.flatMap((group) => group.filteredFestivals);

    return sourceFestivals
      .filter(hasValidCoordinates)
      .map(
        (festival): MappableFestival => ({
          id: festival.id,
          name: festival.name,
          city: festival.city,
          country: festival.country,
          artForm: festival.artForm,
          latitude: festival.latitude as number,
          longitude: festival.longitude as number,
        })
      );
  }, [filteredCountryGroups, selectedCountryGroup]);

  useEffect(() => {
    setVisibleCountryCount(INITIAL_VISIBLE_COUNTRIES);
  }, [countryQuery, selectedArtForm]);

  useEffect(() => {
    if (selectedCountry && !selectedCountryGroup) {
      setSelectedCountry("");
    }
  }, [selectedCountry, selectedCountryGroup]);

  function handleSelectCountry(country: string) {
    setSelectedCountry(country);
  }

  function handleLoadMoreCountries() {
    setVisibleCountryCount((current) => current + INITIAL_VISIBLE_COUNTRIES);
  }

  function handleArtFormSelect(artForm: string) {
    setSelectedArtForm(artForm);
    setIsArtFormMenuOpen(false);
  }

  const hasMoreCountries = visibleCountryCount < filteredCountryGroups.length;
  const selectedArtFormLabel = selectedArtForm || "All Art Forms";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.page}>
        <Text style={styles.heading}>Explore Festivals</Text>
        <Text style={styles.subheading}>
          Discover festivals by country or explore them on the map.
        </Text>

        <View style={styles.mainCard}>
          <View style={styles.controlsRow}>
            <TextInput
              value={countryQuery}
              onChangeText={setCountryQuery}
              placeholder="Search by Country..."
              placeholderTextColor="#9b8ea5"
              style={styles.searchInput}
            />

            <View style={styles.dropdownWrap}>
              <Pressable
                style={styles.dropdownButton}
                onPress={() => setIsArtFormMenuOpen((open) => !open)}
              >
                <Text style={styles.dropdownButtonText}>{selectedArtFormLabel}</Text>
                <Text style={styles.dropdownArrow}>▾</Text>
              </Pressable>

              {isArtFormMenuOpen ? (
                <View style={styles.dropdownMenu}>
                  <Pressable
                    style={styles.dropdownOption}
                    onPress={() => handleArtFormSelect("")}
                  >
                    <Text style={styles.dropdownOptionText}>All Art Forms</Text>
                  </Pressable>

                  {artFormOptions.map((artForm) => (
                    <Pressable
                      key={artForm}
                      style={styles.dropdownOption}
                      onPress={() => handleArtFormSelect(artForm)}
                    >
                      <Text style={styles.dropdownOptionText}>{artForm}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#6f3a83" />
              <Text style={styles.loadingText}>Loading countries...</Text>
            </View>
          ) : null}

          {!loading && error ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageTitle}>Could not load Explore</Text>
              <Text style={styles.messageText}>{error}</Text>
            </View>
          ) : null}

          {!loading && !error ? (
            <>
              <View style={styles.countryGrid}>
                {visibleCountryGroups.map((group) => {
                  const isSelected = selectedCountry === group.country;

                  return (
                    <Pressable
                      key={group.country}
                      style={[
                        styles.countryCard,
                        { width: countryCardWidth },
                        isSelected ? styles.countryCardSelected : null,
                      ]}
                      onPress={() => handleSelectCountry(group.country)}
                    >
                      {group.imageUrl ? (
                        <Image
                          source={{ uri: group.imageUrl }}
                          style={styles.countryImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.countryImageFallback}>
                          <Text style={styles.countryImageFallbackText}>No image</Text>
                        </View>
                      )}

                      <Text style={styles.countryName} numberOfLines={1}>
                        {group.country}
                      </Text>

                      <Text style={styles.countryCount}>
                        {group.filteredFestivalCount} Festival
                        {group.filteredFestivalCount === 1 ? "" : "s"}
                      </Text>

                      <View style={styles.countryButton}>
                        <Text style={styles.countryButtonText}>View Festivals</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {filteredCountryGroups.length === 0 ? (
                <View style={styles.messageBox}>
                  <Text style={styles.messageTitle}>No countries found</Text>
                  <Text style={styles.messageText}>
                    Try clearing the search or changing the art form filter.
                  </Text>
                </View>
              ) : null}

              {hasMoreCountries ? (
                <Pressable
                  style={styles.loadMoreButton}
                  onPress={handleLoadMoreCountries}
                >
                  <Text style={styles.loadMoreButtonText}>Load More Countries</Text>
                </Pressable>
              ) : null}
            </>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.festivals}</Text>
            <Text style={styles.statLabel}>Festivals</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.countries}</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.cities}</Text>
            <Text style={styles.statLabel}>Cities</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.artForms}</Text>
            <Text style={styles.statLabel}>Art Forms</Text>
          </View>
        </View>

        <View style={styles.lowerSection}>
          <View style={[styles.mapCard, { width: mapWidth }]}>
            <FestivalMap
              festivals={festivalsForMap}
              selectedCountry={selectedCountry}
            />
          </View>

          <View style={[styles.sidePanel, { width: sidePanelWidth }]}>
            {!selectedCountryGroup ? (
              <>
                <Text style={styles.sidePanelTitle}>Select a country</Text>
                <Text style={styles.sidePanelText}>
                  Click a country card above to view its festival count here.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.sidePanelCountry}>
                  {selectedCountryGroup.country}
                </Text>
                <Text style={styles.sidePanelCount}>
                  {selectedCountryGroup.filteredFestivalCount} Festival
                  {selectedCountryGroup.filteredFestivalCount === 1 ? "" : "s"} Found
                </Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>
            Ready to plan your next festival season?
          </Text>

          <View style={styles.ctaButtons}>
            <Pressable
              style={styles.primaryCtaButton}
              onPress={() => router.push("/signup")}
            >
              <Text style={styles.primaryCtaButtonText}>
                Create your Free Account
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryCtaButton}
              onPress={() => router.push("/")}
            >
              <Text style={styles.secondaryCtaButtonText}>
                Browse All Festivals
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
  flex: 1,
  backgroundColor: theme.colors.background,
  },

  contentContainer: {
    paddingBottom: 40,
  },

  page: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  heading: {
  textAlign: "center",
  color: theme.colors.primary,
  fontSize: 42,
  fontWeight: "900",
  lineHeight: 46,
  },


  subheading: {
  marginTop: 8,
  textAlign: "center",
  color: theme.colors.textMuted,
  fontSize: 17,
  },


  mainCard: {
  marginTop: 28,
  backgroundColor: theme.colors.surfaceSoft,
  borderRadius: theme.radius.lg,
  padding: 18,
  borderWidth: 1,
  borderColor: theme.colors.border,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
  },

  controlsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginBottom: 18,
    zIndex: 30,
  },

  searchInput: {
  flexGrow: 1,
  minWidth: 220,
  height: 42,
  backgroundColor: theme.colors.surface,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: theme.colors.border,
  paddingHorizontal: 14,
  color: theme.colors.text,
  marginRight: 12,
  marginBottom: 12, 
  },


  dropdownWrap: {
    position: "relative",
    minWidth: 190,
    marginBottom: 12,
    zIndex: 40,
  },

  dropdownButton: {
  height: 42,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: theme.colors.border,
  backgroundColor: theme.colors.surface,
  paddingHorizontal: 14,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
 },


  dropdownButtonText: {
  color: theme.colors.text,
  fontWeight: "600",
 },


  dropdownArrow: {
  color: theme.colors.textMuted,
  fontSize: 14,
},


  dropdownMenu: {
  position: "absolute",
  top: 46,
  left: 0,
  right: 0,
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: 10,
  zIndex: 50,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 4,
},


  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e8f3",
  },

  dropdownOptionText: {
  color: theme.colors.text,
},


  loadingWrap: {
    paddingVertical: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#755c82",
    fontWeight: "600",
  },

  messageBox: {
  marginTop: 8,
  backgroundColor: theme.colors.surface,
  borderRadius: theme.radius.md,
  padding: 16,
  borderWidth: 1,
  borderColor: theme.colors.border,
},


  messageTitle: {
  color: theme.colors.primary,
  fontWeight: "800",
  fontSize: 16,
},


  messageText: {
  marginTop: 6,
  color: theme.colors.textMuted,
  lineHeight: 20,
},


  countryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  countryCard: {
  marginBottom: 18,
  backgroundColor: theme.colors.surface,
  borderRadius: theme.radius.md,
  padding: 12,
  borderWidth: 1,
  borderColor: theme.colors.border,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
},


  countryCardSelected: {
  borderColor: theme.colors.primary,
  borderWidth: 2,
},


  countryImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    backgroundColor: "#ddd",
  },

  countryImageFallback: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },

  countryImageFallbackText: {
    color: "#666",
    fontWeight: "700",
  },

  countryName: {
  marginTop: 10,
  color: theme.colors.text,
  fontSize: 16,
  fontWeight: "800",
},

  countryCount: {
  marginTop: 6,
  color: theme.colors.textMuted,
  fontSize: 13,
},


  countryButton: {
  marginTop: 12,
  height: 38,
  borderRadius: theme.radius.sm,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: theme.colors.primary,
},


  countryButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 13,
  },

  loadMoreButton: {
  marginTop: 6,
  alignSelf: "center",
  height: 42,
  paddingHorizontal: 18,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: theme.colors.primary,
},


  loadMoreButtonText: {
    color: "white",
    fontWeight: "800",
  },

  statsRow: {
    marginTop: 34,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    flexWrap: "wrap",
    backgroundColor: "transparent",
  },

  statItem: {
    flex: 1,
    minWidth: 120,
    alignItems: "center",
    paddingVertical: 10,
  },

  statDivider: {
  width: 1,
  backgroundColor: theme.colors.border,
  marginVertical: 8,
},


  statNumber: {
  color: theme.colors.primary,
  fontSize: 30,
  fontWeight: "900",
  lineHeight: 34,
},


  statLabel: {
  color: theme.colors.textMuted,
  fontSize: 15,
  fontWeight: "800",
  textAlign: "center",
  marginTop: 4,
},



  lowerSection: {
    marginTop: 26,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "stretch",
  },

  mapCard: {
  minHeight: 320,
  borderRadius: 14,
  overflow: "hidden",
  backgroundColor: theme.colors.surfaceSoft,
  borderWidth: 1,
  borderColor: theme.colors.border,
  marginBottom: 16,
},

sidePanel: {
  borderRadius: 14,
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  padding: 18,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
},


  sidePanelTitle: {
  color: theme.colors.text,
  fontSize: 18,
  fontWeight: "800",
},


  sidePanelText: {
  marginTop: 8,
  color: theme.colors.textMuted,
  lineHeight: 20,
},


  sidePanelCountry: {
  color: theme.colors.text,
  fontSize: 22,
  fontWeight: "900",
},

  sidePanelCount: {
  marginTop: 8,
  color: theme.colors.textMuted,
  fontSize: 16,
  fontWeight: "600",
},

  ctaSection: {
    marginTop: 38,
    alignItems: "center",
    paddingBottom: 10,
  },

  ctaTitle: {
  textAlign: "center",
  color: theme.colors.primary,
  fontSize: 34,
  fontWeight: "900",
  lineHeight: 38,
},


  ctaButtons: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  primaryCtaButton: {
  minHeight: 42,
  paddingHorizontal: 18,
  borderRadius: 9,
  backgroundColor: theme.colors.primary,
  alignItems: "center",
  justifyContent: "center",
  marginRight: 12,
  marginBottom: 12,
},

  primaryCtaButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 13,
  },

  secondaryCtaButton: {
  minHeight: 42,
  paddingHorizontal: 18,
  borderRadius: 9,
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 12,
},

  secondaryCtaButtonText: {
  color: theme.colors.textMuted,
  fontWeight: "700",
  fontSize: 13,
},

});