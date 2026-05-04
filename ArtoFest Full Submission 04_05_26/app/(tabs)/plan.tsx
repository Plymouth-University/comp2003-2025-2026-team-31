import { useRouter } from "expo-router";
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
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import Footer from "../../components/footer";
import { API_BASE_URL } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import {
  MONTH_ORDER,
  FestivalRecord,
  formatFestivalTime,
  normaliseMonth,
  normaliseString,
  safeWebUrl,
  toNumericId,
} from "../../lib/festivals";
import { theme } from "../../lib/theme";

type PlanTab = "wishlist" | "calendar" | "ai" | "share";

type WishlistItem = {
  festival_id: number;
  festival_name: string;
  country: string;
  image_url: string;
  website: string;
  month_text?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

type SearchFestival = {
  id: number;
  name: string;
  country: string;
  city: string;
  image_url: string;
  website: string;
  month_text: string;
  start_date: string | null;
  end_date: string | null;
  art_form: string;
};

function getAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

function getAuthJsonHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function cleanWishlistItem(item: any): WishlistItem | null {
  const festivalId = toNumericId(item?.festival_id ?? item?.id);

  if (festivalId === null) {
    return null;
  }

  return {
    festival_id: festivalId,
    festival_name:
      normaliseString(item?.festival_name) ||
      normaliseString(item?.name) ||
      "Unnamed festival",
    country: normaliseString(item?.country) || "Country TBC",
    image_url: normaliseString(item?.image_url),
    website: normaliseString(item?.website),
    month_text: item?.month_text ?? null,
    start_date: item?.start_date ?? null,
    end_date: item?.end_date ?? null,
  };
}

function cleanFestival(item: FestivalRecord): SearchFestival | null {
  const id = toNumericId(item.id);

  if (id === null) {
    return null;
  }

  return {
    id,
    name: normaliseString(item.name) || "Unnamed festival",
    country: normaliseString(item.country) || "Country TBC",
    city: normaliseString(item.city),
    image_url: normaliseString(item.image_url),
    website: normaliseString(item.website),
    month_text: normaliseString(item.month_text),
    start_date: item.start_date ?? null,
    end_date: item.end_date ?? null,
    art_form: normaliseString(item.art_form),
  };
}

function getWishlistMonth(item: WishlistItem) {
  return normaliseMonth(item.month_text, item.start_date);
}

function getFestivalMonth(item: SearchFestival) {
  return normaliseMonth(item.month_text, item.start_date);
}

function getFestivalDateText(item: SearchFestival | WishlistItem) {
  return (
    formatFestivalTime(item.start_date, item.end_date, item.month_text) ||
    "Date TBC"
  );
}

function buildPdfHtml(items: WishlistItem[], username?: string | null) {
  const generatedDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const rows = items
    .map((item, index) => {
      const dateText = getFestivalDateText(item);
      const website = safeWebUrl(item.website);

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${item.festival_name}</td>
          <td>${item.country}</td>
          <td>${dateText}</td>
          <td>${website || "Website unavailable"}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>ArtoFest Wishlist</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #2b2130;
            padding: 32px;
          }

          h1 {
            color: #55286f;
            margin-bottom: 4px;
          }

          .meta {
            color: #6f6176;
            margin-bottom: 24px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th {
            background: #55286f;
            color: white;
            text-align: left;
            padding: 10px;
          }

          td {
            border-bottom: 1px solid #ddd3e3;
            padding: 10px;
            vertical-align: top;
          }

          .note {
            margin-top: 28px;
            color: #6f6176;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <h1>ArtoFest Wishlist</h1>
        <p class="meta">
          Generated for ${username || "ArtoFest user"} on ${generatedDate}
        </p>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Festival</th>
              <th>Country</th>
              <th>Date</th>
              <th>Website</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <p class="note">
          This PDF was generated from the user's saved ArtoFest wishlist.
        </p>

        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
  `;
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tabButton, active ? styles.tabButtonActive : null]}
      onPress={onPress}
    >
      <Text
        style={[styles.tabButtonText, active ? styles.tabButtonTextActive : null]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function PlanScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { session, isAuthenticated, isHydrating } = useAuth();

  const isWide = width >= 900;

  const [activeTab, setActiveTab] = useState<PlanTab>("wishlist");
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [festivals, setFestivals] = useState<SearchFestival[]>([]);

  const [selectedMonth, setSelectedMonth] = useState("All");
  const [festivalSearch, setFestivalSearch] = useState("");

  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [festivalLoading, setFestivalLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const savedFestivalIds = useMemo(() => {
    return new Set(wishlist.map((item) => item.festival_id));
  }, [wishlist]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();

    wishlist.forEach((item) => {
      const month = getWishlistMonth(item);
      if (month) {
        months.add(month);
      }
    });

    return ["All", ...MONTH_ORDER.filter((month) => months.has(month))];
  }, [wishlist]);

  const filteredWishlist = useMemo(() => {
    if (selectedMonth === "All") {
      return wishlist;
    }

    return wishlist.filter((item) => getWishlistMonth(item) === selectedMonth);
  }, [wishlist, selectedMonth]);

  const searchResults = useMemo(() => {
    const query = festivalSearch.trim().toLowerCase();

    if (!query) {
      return festivals.slice(0, 8);
    }

    return festivals
      .filter((festival) => {
        const searchable = [
          festival.name,
          festival.country,
          festival.city,
          festival.art_form,
          getFestivalMonth(festival),
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      })
      .slice(0, 10);
  }, [festivalSearch, festivals]);

  useEffect(() => {
    if (!isAuthenticated || !session?.token) {
      return;
    }

    loadWishlist();
    loadFestivals();
  }, [isAuthenticated, session?.token]);

  async function loadWishlist() {
    if (!session?.token) return;

    try {
      setWishlistLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/wishlist`, {
        headers: getAuthHeaders(session.token),
      });

      if (!response.ok) {
        throw new Error(`Wishlist request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Wishlist API did not return an array.");
      }

      const cleaned = data
        .map(cleanWishlistItem)
        .filter((item): item is WishlistItem => item !== null);

      setWishlist(cleaned);
    } catch (err) {
      console.error("Failed to load wishlist:", err);
      setError(
        "Could not load your wishlist. Check that the backend wishlist endpoint accepts the login token."
      );
    } finally {
      setWishlistLoading(false);
    }
  }

  async function loadFestivals() {
    try {
      setFestivalLoading(true);

      const response = await fetch(`${API_BASE_URL}/festivals`);

      if (!response.ok) {
        throw new Error(`Festival request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Festival API did not return an array.");
      }

      const cleaned = data
        .map(cleanFestival)
        .filter((item): item is SearchFestival => item !== null);

      setFestivals(cleaned);
    } catch (err) {
      console.error("Failed to load festivals:", err);
      setError("Could not load festival search results from the database.");
    } finally {
      setFestivalLoading(false);
    }
  }

  async function addFestivalToWishlist(festival: SearchFestival) {
    if (!session?.token) return;

    try {
      setMessage("");
      setError("");

      const response = await fetch(`${API_BASE_URL}/wishlist`, {
        method: "POST",
        headers: getAuthJsonHeaders(session.token),
        body: JSON.stringify({
          festival_id: festival.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Add wishlist request failed with status ${response.status}`);
      }

      await loadWishlist();
      setMessage(`${festival.name} was added to your wishlist.`);
    } catch (err) {
      console.error("Failed to add festival to wishlist:", err);
      setError("Could not add this festival to your wishlist.");
    }
  }

  async function removeFestivalFromWishlist(festivalId: number) {
    if (!session?.token) return;

    try {
      setMessage("");
      setError("");

      const response = await fetch(`${API_BASE_URL}/wishlist/${festivalId}`, {
        method: "DELETE",
        headers: getAuthHeaders(session.token),
      });

      if (!response.ok) {
        throw new Error(
          `Remove wishlist request failed with status ${response.status}`
        );
      }

      setWishlist((current) =>
        current.filter((item) => item.festival_id !== festivalId)
      );

      setMessage("Festival removed from your wishlist.");
    } catch (err) {
      console.error("Failed to remove festival from wishlist:", err);
      setError("Could not remove this festival from your wishlist.");
    }
  }

  async function openWebsite(url: string) {
    const safeUrl = safeWebUrl(url);

    if (!safeUrl) {
      setError("No website is available for this festival.");
      return;
    }

    try {
      await Linking.openURL(safeUrl);
    } catch {
      setError("Could not open the festival website.");
    }
  }

  function exportWishlistAsPdf() {
    if (wishlist.length === 0) {
      setError("Add at least one festival before exporting your wishlist.");
      return;
    }

    if (Platform.OS !== "web") {
      setError(
        "PDF export is currently available on the web version. Native PDF export would need an extra Expo print/share package."
      );
      return;
    }

    const html = buildPdfHtml(wishlist, session?.username || session?.email);
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setError("The browser blocked the PDF window. Allow pop-ups and try again.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  if (isHydrating) {
    return (
      <View style={styles.screen}>
        <View style={styles.loadingPage}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Checking account session...</Text>
        </View>
        <Footer />
      </View>
    );
  }

  if (!isAuthenticated || !session) {
    return (
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scrollInner}>
            <View style={styles.page}>
              <View style={styles.loggedOutCard}>
                <Text style={styles.eyebrow}>Planning requires an account</Text>
                <Text style={styles.heroTitle}>Create an account to use Wishlist</Text>

                <Text style={styles.heroSubtitle}>
                  Your wishlist is saved to your account, so you can log out,
                  come back later, and continue planning without losing your saved
                  festivals.
                </Text>

                <View style={styles.loggedOutButtonRow}>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => router.push("/login")}
                  >
                    <Text style={styles.primaryButtonText}>Log in</Text>
                  </Pressable>

                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => router.push("/signup")}
                  >
                    <Text style={styles.secondaryButtonText}>Create account</Text>
                  </Pressable>

                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => router.push("/")}
                  >
                    <Text style={styles.secondaryButtonText}>Browse festivals</Text>
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

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.scrollInner}>
          <View style={styles.page}>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>Personal festival planning</Text>
              <Text style={styles.heroTitle}>Plan your festival wishlist</Text>
              <Text style={styles.heroSubtitle}>
                Search festivals from the database, save them to your account,
                organise them by month, and export your wishlist to share.
              </Text>

              <View style={styles.accountPill}>
                <Text style={styles.accountPillText}>
                  Signed in as {session.username || session.email}
                </Text>
              </View>
            </View>

            <View style={styles.tabs}>
              <TabButton
                label="Wishlist"
                active={activeTab === "wishlist"}
                onPress={() => setActiveTab("wishlist")}
              />
              <TabButton
                label="Month Selector"
                active={activeTab === "calendar"}
                onPress={() => setActiveTab("calendar")}
              />
              <TabButton
                label="Create with AI"
                active={activeTab === "ai"}
                onPress={() => setActiveTab("ai")}
              />
              <TabButton
                label="Share"
                active={activeTab === "share"}
                onPress={() => setActiveTab("share")}
              />
            </View>

            {message ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{message}</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {activeTab === "wishlist" ? (
              <View style={[styles.twoColumnLayout, { flexDirection: isWide ? "row" : "column" }]}>
                <View style={[styles.panel, { width: isWide ? "42%" : "100%" }]}>
                  <Text style={styles.panelTitle}>Add festivals</Text>
                  <Text style={styles.panelText}>
                    Search festivals from the database and add them to your saved
                    wishlist.
                  </Text>

                  <TextInput
                    value={festivalSearch}
                    onChangeText={setFestivalSearch}
                    placeholder="Search by festival, country, city, month or art form..."
                    placeholderTextColor="#9b8ea5"
                    style={styles.searchInput}
                  />

                  {festivalLoading ? (
                    <View style={styles.inlineLoading}>
                      <ActivityIndicator color={theme.colors.primary} />
                      <Text style={styles.inlineLoadingText}>Loading festivals...</Text>
                    </View>
                  ) : null}

                  <View style={styles.searchResultList}>
                    {searchResults.map((festival) => {
                      const alreadySaved = savedFestivalIds.has(festival.id);

                      return (
                        <View key={festival.id} style={styles.searchResultCard}>
                          <View style={styles.searchResultTextWrap}>
                            <Text style={styles.searchResultTitle} numberOfLines={2}>
                              {festival.name}
                            </Text>
                            <Text style={styles.searchResultMeta} numberOfLines={1}>
                              {[festival.city, festival.country]
                                .filter(Boolean)
                                .join(", ")}
                            </Text>
                            <Text style={styles.searchResultDate} numberOfLines={1}>
                              {getFestivalDateText(festival)}
                            </Text>
                          </View>

                          <Pressable
                            style={[
                              styles.addButton,
                              alreadySaved ? styles.addButtonDisabled : null,
                            ]}
                            disabled={alreadySaved}
                            onPress={() => addFestivalToWishlist(festival)}
                          >
                            <Text
                              style={[
                                styles.addButtonText,
                                alreadySaved ? styles.addButtonTextDisabled : null,
                              ]}
                            >
                              {alreadySaved ? "Saved" : "Add"}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <View style={[styles.panel, { width: isWide ? "55%" : "100%" }]}>
                  <View style={styles.panelHeaderRow}>
                    <View>
                      <Text style={styles.panelTitle}>Your wishlist</Text>
                      <Text style={styles.panelText}>
                        {wishlist.length} saved festival
                        {wishlist.length === 1 ? "" : "s"}
                      </Text>
                    </View>

                    <Pressable style={styles.refreshButton} onPress={loadWishlist}>
                      <Text style={styles.refreshButtonText}>Refresh</Text>
                    </Pressable>
                  </View>

                  {wishlistLoading ? (
                    <View style={styles.inlineLoading}>
                      <ActivityIndicator color={theme.colors.primary} />
                      <Text style={styles.inlineLoadingText}>Loading wishlist...</Text>
                    </View>
                  ) : null}

                  {!wishlistLoading && wishlist.length === 0 ? (
                    <View style={styles.emptyBox}>
                      <Text style={styles.emptyTitle}>No saved festivals yet</Text>
                      <Text style={styles.emptyText}>
                        Use the search panel to add festivals to your account.
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.wishlistGrid}>
                    {wishlist.map((item) => (
                      <View key={item.festival_id} style={styles.savedCard}>
                        {item.image_url ? (
                          <Image
                            source={{ uri: item.image_url }}
                            style={styles.savedImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.savedImageFallback}>
                            <Text style={styles.savedImageFallbackText}>
                              artofest
                            </Text>
                          </View>
                        )}

                        <View style={styles.savedBody}>
                          <Text style={styles.savedTitle} numberOfLines={2}>
                            {item.festival_name}
                          </Text>

                          <Text style={styles.savedCountry} numberOfLines={1}>
                            {item.country}
                          </Text>

                          <Text style={styles.savedDate} numberOfLines={1}>
                            {getFestivalDateText(item)}
                          </Text>

                          <View style={styles.savedActions}>
                            <Pressable
                              style={styles.websiteButton}
                              onPress={() => openWebsite(item.website)}
                            >
                              <Text style={styles.websiteButtonText}>Website</Text>
                            </Pressable>

                            <Pressable
                              style={styles.removeButton}
                              onPress={() =>
                                removeFestivalFromWishlist(item.festival_id)
                              }
                            >
                              <Text style={styles.removeButtonText}>Remove</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            {activeTab === "calendar" ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Month selector</Text>
                <Text style={styles.panelText}>
                  Select a month to view saved festivals from your wishlist. This
                  is a month-based planning view, not a day-by-day calendar.
                </Text>

                <View style={styles.monthRow}>
                  {availableMonths.map((month) => (
                    <Pressable
                      key={month}
                      style={[
                        styles.monthButton,
                        selectedMonth === month ? styles.monthButtonActive : null,
                      ]}
                      onPress={() => setSelectedMonth(month)}
                    >
                      <Text
                        style={[
                          styles.monthButtonText,
                          selectedMonth === month
                            ? styles.monthButtonTextActive
                            : null,
                        ]}
                      >
                        {month}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.monthResultTitle}>
                  {selectedMonth === "All"
                    ? "All saved festivals"
                    : `Saved festivals in ${selectedMonth}`}
                </Text>

                {filteredWishlist.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>No festivals for this month</Text>
                    <Text style={styles.emptyText}>
                      Try another month or add more festivals to your wishlist.
                    </Text>
                  </View>
                ) : null}

                <View style={styles.calendarList}>
                  {filteredWishlist.map((item) => (
                    <View key={item.festival_id} style={styles.calendarItem}>
                      <View>
                        <Text style={styles.calendarItemTitle}>
                          {item.festival_name}
                        </Text>
                        <Text style={styles.calendarItemMeta}>
                          {item.country} · {getFestivalDateText(item)}
                        </Text>
                      </View>

                      <Pressable
                        style={styles.removeSmallButton}
                        onPress={() => removeFestivalFromWishlist(item.festival_id)}
                      >
                        <Text style={styles.removeSmallButtonText}>Remove</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {activeTab === "ai" ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Create with AI</Text>
                <Text style={styles.panelText}>
                  This feature is a placeholder for now. In a full version,
                  ArtoFest could use AI to turn your saved wishlist into a travel
                  itinerary, route plan, packing list or festival schedule.
                </Text>

                <View style={styles.placeholderBox}>
                  <Text style={styles.placeholderTitle}>AI planner coming later</Text>
                  <Text style={styles.placeholderText}>
                    This button is intentionally not connected yet. It demonstrates
                    where the AI planning feature would be added in a future
                    version.
                  </Text>

                  <Pressable
                    style={styles.disabledAiButton}
                    onPress={() =>
                      setMessage(
                        "Create with AI is currently a placeholder feature."
                      )
                    }
                  >
                    <Text style={styles.disabledAiButtonText}>Create with AI</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {activeTab === "share" ? (
              <View style={styles.panel}>
                <Text style={styles.panelTitle}>Share wishlist</Text>
                <Text style={styles.panelText}>
                  Export your saved festivals as a PDF so you can send your plan
                  to friends or keep a copy for your trip.
                </Text>

                <View style={styles.shareCard}>
                  <Text style={styles.shareTitle}>Wishlist PDF</Text>
                  <Text style={styles.shareText}>
                    Your PDF will include festival names, countries, dates and
                    website links.
                  </Text>

                  <Pressable
                    style={styles.primaryButton}
                    onPress={exportWishlistAsPdf}
                  >
                    <Text style={styles.primaryButtonText}>
                      Save wishlist as PDF
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
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

  loadingPage: {
    flex: 1,
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loadingText: {
    color: theme.colors.textMuted,
    marginTop: 12,
    fontSize: 15,
  },

  page: {
    width: "100%",
    maxWidth: 1980,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
  },

  hero: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 26,
  },

  loggedOutCard: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 28,
  },

  eyebrow: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  heroTitle: {
    color: theme.colors.primary,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "900",
    marginTop: 8,
  },

  heroSubtitle: {
    color: theme.colors.textMuted,
    marginTop: 12,
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 820,
  },

  accountPill: {
    alignSelf: "flex-start",
    marginTop: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  accountPillText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 13,
  },

  tabs: {
    marginTop: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  tabButton: {
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },

  tabButtonText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },

  tabButtonTextActive: {
    color: "#ffffff",
  },

  successBox: {
    marginTop: 16,
    backgroundColor: "#edf7ef",
    borderWidth: 1,
    borderColor: "#cce8d1",
    borderRadius: theme.radius.lg,
    padding: 14,
  },

  successText: {
    color: "#276738",
    fontWeight: "800",
  },

  errorBox: {
    marginTop: 16,
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#f1c4c4",
    borderRadius: theme.radius.lg,
    padding: 14,
  },

  errorText: {
    color: "#9b2d2d",
    fontWeight: "800",
  },

  twoColumnLayout: {
    marginTop: 20,
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
  },

  panel: {
    marginTop: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 18,
  },

  panelHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  panelTitle: {
    color: theme.colors.primary,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },

  panelText: {
    color: theme.colors.textMuted,
    marginTop: 6,
    fontSize: 15,
    lineHeight: 23,
  },

  searchInput: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceSoft,
    paddingHorizontal: 14,
    color: theme.colors.text,
    fontSize: 15,
  },

  inlineLoading: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  inlineLoadingText: {
    color: theme.colors.textMuted,
    fontWeight: "700",
  },

  searchResultList: {
    marginTop: 14,
    gap: 10,
  },

  searchResultCard: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  searchResultTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  searchResultTitle: {
    color: theme.colors.primary,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
  },

  searchResultMeta: {
    color: theme.colors.text,
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
  },

  searchResultDate: {
    color: theme.colors.textMuted,
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
  },

  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  addButtonDisabled: {
    backgroundColor: theme.colors.border,
  },

  addButtonText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 13,
  },

  addButtonTextDisabled: {
    color: theme.colors.textMuted,
  },

  refreshButton: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  refreshButtonText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 13,
  },

  emptyBox: {
    marginTop: 14,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 16,
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

  wishlistGrid: {
    marginTop: 14,
    gap: 14,
  },

  savedCard: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },

  savedImage: {
    width: "100%",
    height: 170,
    backgroundColor: theme.colors.surface,
  },

  savedImageFallback: {
    width: "100%",
    height: 170,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  savedImageFallbackText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 26,
  },

  savedBody: {
    padding: 14,
  },

  savedTitle: {
    color: theme.colors.primary,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
  },

  savedCountry: {
    color: theme.colors.text,
    marginTop: 6,
    fontWeight: "800",
  },

  savedDate: {
    color: theme.colors.textMuted,
    marginTop: 4,
    fontWeight: "700",
  },

  savedActions: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  websiteButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  websiteButtonText: {
    color: "#ffffff",
    fontWeight: "900",
  },

  removeButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  removeButtonText: {
    color: theme.colors.primary,
    fontWeight: "900",
  },

  monthRow: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  monthButton: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  monthButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  monthButtonText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 13,
  },

  monthButtonTextActive: {
    color: "#ffffff",
  },

  monthResultTitle: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 22,
  },

  calendarList: {
    marginTop: 12,
    gap: 10,
  },

  calendarItem: {
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  calendarItemTitle: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 16,
  },

  calendarItemMeta: {
    color: theme.colors.textMuted,
    marginTop: 4,
    fontWeight: "700",
  },

  removeSmallButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  removeSmallButtonText: {
    color: theme.colors.primary,
    fontWeight: "900",
    fontSize: 12,
  },

  placeholderBox: {
    marginTop: 18,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 18,
  },

  placeholderTitle: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: "900",
  },

  placeholderText: {
    color: theme.colors.textMuted,
    marginTop: 8,
    lineHeight: 23,
  },

  disabledAiButton: {
    marginTop: 16,
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  disabledAiButtonText: {
    color: "#ffffff",
    fontWeight: "900",
  },

  shareCard: {
    marginTop: 18,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 18,
  },

  shareTitle: {
    color: theme.colors.primary,
    fontSize: 20,
    fontWeight: "900",
  },

  shareText: {
    color: theme.colors.textMuted,
    marginTop: 8,
    lineHeight: 23,
    marginBottom: 16,
  },

  loggedOutButtonRow: {
    marginTop: 22,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignSelf: "flex-start",
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },

  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignSelf: "flex-start",
  },

  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },
});