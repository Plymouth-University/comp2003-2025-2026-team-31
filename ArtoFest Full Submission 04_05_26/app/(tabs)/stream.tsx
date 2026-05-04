import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import Footer from "../../components/footer";
import { API_BASE_URL } from "../../lib/api";
import { theme } from "../../lib/theme";

type ApiStream = {
  id?: number;
  title?: string | null;
  url?: string | null;
  platform?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  image_url?: string | null;
  preview_image?: string | null;
};

type ApiCategory = {
  name?: string | null;
  streams?: ApiStream[];
};

type ApiStreamGroup = {
  festival_id?: number;
  festival_name?: string | null;
  categories?: ApiCategory[];
};

type StreamCard = {
  id: string;
  streamId: number | null;
  title: string;
  description: string;
  url: string;
  platform: string;
  festivalId: number | null;
  festivalName: string;
  categoryName: string;
  thumbnailUrl: string;
};

function normaliseString(value: unknown) {
  return String(value ?? "").trim();
}

function normalisePlatform(value: unknown) {
  const cleaned = normaliseString(value).toLowerCase();

  if (cleaned.includes("youtube") || cleaned.includes("youtu.be")) {
    return "youtube";
  }

  if (cleaned.includes("vimeo")) {
    return "vimeo";
  }

  if (cleaned.length > 0) {
    return cleaned;
  }

  return "web";
}

function makeExternalUrl(url: string) {
  const cleaned = url.trim();

  if (!cleaned) return "";

  if (/^https?:\/\//i.test(cleaned)) {
    return cleaned;
  }

  return `https://${cleaned}`;
}

function getYouTubeVideoId(url: string) {
  const cleaned = url.trim();

  if (!cleaned) return "";

  try {
    const parsedUrl = new URL(makeExternalUrl(cleaned));
    const host = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (host.includes("youtube.com")) {
      const videoParam = parsedUrl.searchParams.get("v");

      if (videoParam) {
        return videoParam;
      }

      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      const knownPathTypes = ["embed", "live", "shorts"];

      if (pathParts.length >= 2 && knownPathTypes.includes(pathParts[0])) {
        return pathParts[1];
      }
    }
  } catch {
    const fallbackMatch = cleaned.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|live\/|shorts\/))([^?&/]+)/
    );

    return fallbackMatch?.[1] ?? "";
  }

  return "";
}

function getAutomaticThumbnail(stream: StreamCard) {
  const explicitThumbnail = stream.thumbnailUrl;

  if (explicitThumbnail) {
    return explicitThumbnail;
  }

  const youtubeId = getYouTubeVideoId(stream.url);

  if (youtubeId) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }

  return "";
}

function flattenStreams(data: ApiStreamGroup[]) {
  const flattened: StreamCard[] = [];

  data.forEach((festivalGroup, groupIndex) => {
    const festivalId =
      typeof festivalGroup.festival_id === "number"
        ? festivalGroup.festival_id
        : null;

    const festivalName =
      normaliseString(festivalGroup.festival_name) || "Unknown festival";

    const categories = Array.isArray(festivalGroup.categories)
      ? festivalGroup.categories
      : [];

    categories.forEach((category, categoryIndex) => {
      const categoryName = normaliseString(category.name) || "Uncategorised";
      const streams = Array.isArray(category.streams) ? category.streams : [];

      streams.forEach((stream, streamIndex) => {
        const title = normaliseString(stream.title) || "Untitled stream";
        const url = makeExternalUrl(normaliseString(stream.url));

        if (!url) return;

        const platform = normalisePlatform(stream.platform || url);
        const description =
          normaliseString(stream.description) ||
          `Watch ${title} from ${festivalName} in ${categoryName}.`;

        const streamId =
          typeof stream.id === "number" && Number.isFinite(stream.id)
            ? stream.id
            : null;

        const thumbnailUrl =
          normaliseString(stream.thumbnail_url) ||
          normaliseString(stream.image_url) ||
          normaliseString(stream.preview_image);

        flattened.push({
          id: `${festivalId ?? groupIndex}-${categoryIndex}-${
            streamId ?? streamIndex
          }`,
          streamId,
          title,
          description,
          url,
          platform,
          festivalId,
          festivalName,
          categoryName,
          thumbnailUrl,
        });
      });
    });
  });

  return flattened;
}

async function openExternalUrl(url: string) {
  try {
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
    } else {
      console.warn("Cannot open stream URL:", url);
    }
  } catch (error) {
    console.error("Failed to open stream URL:", error);
  }
}

function PlatformLabel({ platform }: { platform: string }) {
  const label = platform.length > 0 ? platform.toUpperCase() : "WEB";

  return (
    <View style={styles.platformBadge}>
      <Text style={styles.platformBadgeText}>{label}</Text>
    </View>
  );
}

function StreamThumbnail({ stream }: { stream: StreamCard }) {
  const thumbnail = getAutomaticThumbnail(stream);

  if (thumbnail) {
    return (
      <Image
        source={{ uri: thumbnail }}
        style={styles.thumbnailImage}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={styles.fallbackThumbnail}>
      <Text style={styles.fallbackLogo}>artofest</Text>
      <Text style={styles.fallbackText}>
        {stream.platform === "vimeo" ? "Vimeo stream" : "External stream"}
      </Text>
    </View>
  );
}

export default function StreamScreen() {
  const { width } = useWindowDimensions();

  const cardWidth = width >= 1100 ? "31.5%" : width >= 700 ? "48%" : "100%";

  const [streams, setStreams] = useState<StreamCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStreams() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/streams`);

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The streams API did not return an array.");
        }

        setStreams(flattenStreams(data));
      } catch (err) {
        console.error("Failed to load streams:", err);
        setError("Failed to load stream content from the server.");
      } finally {
        setLoading(false);
      }
    }

    loadStreams();
  }, []);

  const streamStats = useMemo(() => {
    const festivals = new Set<string>();
    const categories = new Set<string>();

    streams.forEach((stream) => {
      festivals.add(stream.festivalName);
      categories.add(stream.categoryName);
    });

    return {
      streams: streams.length,
      festivals: festivals.size,
      categories: categories.size,
    };
  }, [streams]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scrollInner}>
          <View style={styles.page}>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>Festival streaming hub</Text>
              <Text style={styles.title}>Stream Festival Content</Text>
              <Text style={styles.subtitle}>
                Explore talks, performances, interviews and festival videos from
                the ArtoFest database.
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{streamStats.streams}</Text>
                <Text style={styles.statLabel}>Streams</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{streamStats.festivals}</Text>
                <Text style={styles.statLabel}>Festivals</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{streamStats.categories}</Text>
                <Text style={styles.statLabel}>Categories</Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading stream content...</Text>
              </View>
            ) : null}

            {!loading && error ? (
              <View style={styles.messageBox}>
                <Text style={styles.messageTitle}>Could not load streams</Text>
                <Text style={styles.messageText}>{error}</Text>
              </View>
            ) : null}

            {!loading && !error && streams.length === 0 ? (
              <View style={styles.messageBox}>
                <Text style={styles.messageTitle}>No streams available</Text>
                <Text style={styles.messageText}>
                  No stream content has been added to the database yet.
                </Text>
              </View>
            ) : null}

            {!loading && !error && streams.length > 0 ? (
              <View style={styles.grid}>
                {streams.map((stream) => (
                  <Pressable
                    key={stream.id}
                    style={[styles.card, { width: cardWidth }]}
                    onPress={() => openExternalUrl(stream.url)}
                  >
                    <View style={styles.thumbnailWrap}>
                      <StreamThumbnail stream={stream} />
                      <View style={styles.badgePosition}>
                        <PlatformLabel platform={stream.platform} />
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {stream.title}
                      </Text>

                      <Text style={styles.cardFestival} numberOfLines={1}>
                        {stream.festivalName}
                      </Text>

                      <Text style={styles.cardCategory} numberOfLines={1}>
                        {stream.categoryName}
                      </Text>

                      <Text style={styles.cardDescription} numberOfLines={3}>
                        {stream.description}
                      </Text>

                      <View style={styles.openRow}>
                        <Text style={styles.openText}>Open stream</Text>
                        <Text style={styles.openArrow}>↗</Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
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
    padding: 24,
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
    fontSize: 40,
    lineHeight: 46,
    fontWeight: "900",
    marginTop: 8,
  },

  subtitle: {
    color: theme.colors.textMuted,
    marginTop: 12,
    fontSize: 17,
    lineHeight: 26,
    maxWidth: 760,
  },

  statsRow: {
    marginTop: 22,
    marginBottom: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 18,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    flexWrap: "wrap",
  },

  statItem: {
    alignItems: "center",
    minWidth: 100,
    marginVertical: 6,
  },

  statNumber: {
    color: theme.colors.primary,
    fontSize: 24,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontSize: 13,
  },

  statDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: theme.colors.border,
  },

  loadingBox: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    color: theme.colors.textMuted,
    fontSize: 15,
  },

  messageBox: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 22,
  },

  messageTitle: {
    color: theme.colors.primary,
    fontSize: 22,
    fontWeight: "900",
  },

  messageText: {
    color: theme.colors.textMuted,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 23,
  },

  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    marginBottom: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  thumbnailWrap: {
    width: "100%",
    height: 190,
    backgroundColor: theme.colors.surfaceSoft,
    position: "relative",
  },

  thumbnailImage: {
    width: "100%",
    height: "100%",
  },

  fallbackThumbnail: {
    width: "100%",
    height: "100%",
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },

  fallbackLogo: {
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },

  fallbackText: {
    color: "#ffffff",
    opacity: 0.86,
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  badgePosition: {
    position: "absolute",
    left: 12,
    bottom: 12,
  },

  platformBadge: {
    backgroundColor: "rgba(22, 0, 25, 0.86)",
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  platformBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  cardBody: {
    padding: 16,
  },

  cardTitle: {
    color: theme.colors.primary,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
  },

  cardFestival: {
    color: theme.colors.text,
    marginTop: 8,
    fontSize: 14,
    fontWeight: "800",
  },

  cardCategory: {
    color: theme.colors.textMuted,
    marginTop: 3,
    fontSize: 13,
    fontWeight: "700",
  },

  cardDescription: {
    color: theme.colors.textMuted,
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
  },

  openRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  openText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },

  openArrow: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 6,
  },
});