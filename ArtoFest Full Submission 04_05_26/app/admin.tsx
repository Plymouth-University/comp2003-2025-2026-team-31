import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import Footer from "../components/footer";
import { API_BASE_URL } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { theme } from "../lib/theme";

type AdminTab = "festivals" | "streams";
type FormMode = "create" | "update" | "delete";

type FestivalSummary = {
  id?: number | string | null;
  name?: string | null;
  city?: string | null;
  country?: string | null;
  website?: string | null;
  image_url?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  month_text?: string | null;
  month?: string | null;
  art_form?: string | null;
  genres?: string[] | null;
  images?: string[] | null;
};

type StreamSummary = {
  id?: number | string | null;
  title?: string | null;
  url?: string | null;
  platform?: string | null;
  category_id?: number | string | null;
  festival_id?: number | string | null;
  festival_name?: string | null;
  category_name?: string | null;
};

type StreamGroup = {
  festival_id?: number | string | null;
  festival_name?: string | null;
  categories?: {
    name?: string | null;
    streams?: StreamSummary[];
  }[];
};

type FestivalForm = {
  id: string;
  name: string;
  city: string;
  country: string;
  website: string;
  image_url: string;
  latitude: string;
  longitude: string;
  description: string;
  start_date: string;
  end_date: string;
  month: string;
  art_form: string;
  genresCsv: string;
  imagesCsv: string;
};

type StreamForm = {
  id: string;
  festival_id: string;
  title: string;
  url: string;
  platform: string;
  category_id: string;
};

const emptyFestivalForm: FestivalForm = {
  id: "",
  name: "",
  city: "",
  country: "",
  website: "",
  image_url: "",
  latitude: "",
  longitude: "",
  description: "",
  start_date: "",
  end_date: "",
  month: "",
  art_form: "",
  genresCsv: "",
  imagesCsv: "",
};

const emptyStreamForm: StreamForm = {
  id: "",
  festival_id: "",
  title: "",
  url: "",
  platform: "",
  category_id: "",
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function csvToArray(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberOrNull(value: string) {
  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) ? parsed : null;
}

function dateOnly(value: unknown) {
  const text = clean(value);

  if (!text) {
    return "";
  }

  return text.slice(0, 10);
}

function makeAuthHeaders(token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function confirmAction(message: string) {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(message));
  }

  return new Promise<boolean>((resolve) => {
    Alert.alert("Confirm action", message, [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: "Continue",
        style: "destructive",
        onPress: () => resolve(true),
      },
    ]);
  });
}

async function parseResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function festivalToForm(festival: FestivalSummary): FestivalForm {
  return {
    id: clean(festival.id),
    name: clean(festival.name),
    city: clean(festival.city),
    country: clean(festival.country),
    website: clean(festival.website),
    image_url: clean(festival.image_url),
    latitude: clean(festival.latitude),
    longitude: clean(festival.longitude),
    description: clean(festival.description),
    start_date: dateOnly(festival.start_date),
    end_date: dateOnly(festival.end_date),
    month: clean(festival.month ?? festival.month_text),
    art_form: clean(festival.art_form),
    genresCsv: Array.isArray(festival.genres) ? festival.genres.join(", ") : "",
    imagesCsv: Array.isArray(festival.images) ? festival.images.join(", ") : "",
  };
}

function flattenStreams(groups: unknown): StreamSummary[] {
  if (!Array.isArray(groups)) {
    return [];
  }

  const flattened: StreamSummary[] = [];

  groups.forEach((group: StreamGroup) => {
    const categories = Array.isArray(group.categories) ? group.categories : [];

    categories.forEach((category) => {
      const streams = Array.isArray(category.streams) ? category.streams : [];

      streams.forEach((stream) => {
        flattened.push({
          ...stream,
          festival_id: stream.festival_id ?? group.festival_id ?? null,
          festival_name: stream.festival_name ?? group.festival_name ?? null,
          category_name: stream.category_name ?? category.name ?? null,
        });
      });
    });
  });

  return flattened;
}

function streamToForm(stream: StreamSummary): StreamForm {
  return {
    id: clean(stream.id),
    festival_id: clean(stream.festival_id),
    title: clean(stream.title),
    url: clean(stream.url),
    platform: clean(stream.platform),
    category_id: clean(stream.category_id),
  };
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  helper,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "url";
  multiline?: boolean;
  helper?: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline ? styles.multilineInput : null]}
      />
      {helper ? <Text style={styles.fieldHelper}>{helper}</Text> : null}
    </View>
  );
}

function ModeButton({
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
      onPress={onPress}
      style={[styles.modeButton, active ? styles.modeButtonActive : null]}
    >
      <Text style={[styles.modeButtonText, active ? styles.modeButtonTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function AdminScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 980;

  const { session, isAuthenticated, isHydrating } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("festivals");
  const [festivalMode, setFestivalMode] = useState<FormMode>("create");
  const [streamMode, setStreamMode] = useState<FormMode>("create");

  const [festivalForm, setFestivalForm] = useState<FestivalForm>(emptyFestivalForm);
  const [streamForm, setStreamForm] = useState<StreamForm>(emptyStreamForm);

  const [festivals, setFestivals] = useState<FestivalSummary[]>([]);
  const [streams, setStreams] = useState<StreamSummary[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const authHeaders = useMemo(() => makeAuthHeaders(session?.token), [session?.token]);

  function updateFestivalField<K extends keyof FestivalForm>(
    key: K,
    value: FestivalForm[K]
  ) {
    setFestivalForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateStreamField<K extends keyof StreamForm>(key: K, value: StreamForm[K]) {
    setStreamForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function loadAdminData() {
    setIsLoadingData(true);
    setMessage("");

    try {
      const [festivalResponse, streamResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/festivals`),
        fetch(`${API_BASE_URL}/streams`),
      ]);

      const festivalData = await parseResponse(festivalResponse);
      const streamData = await parseResponse(streamResponse);

      setFestivals(Array.isArray(festivalData) ? festivalData : []);
      setStreams(flattenStreams(streamData));
    } catch (error) {
      console.error(error);
      setMessage("Could not load existing festivals or streams. Check the API is running.");
    } finally {
      setIsLoadingData(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  function validateFestivalForm() {
    if (festivalMode !== "create" && !festivalForm.id.trim()) {
      return "Enter or select a festival ID first.";
    }

    if (festivalMode === "delete") {
      return "";
    }

    if (!festivalForm.name.trim()) {
      return "Festival name is required.";
    }

    if (!festivalForm.city.trim()) {
      return "City is required.";
    }

    if (!festivalForm.country.trim()) {
      return "Country is required.";
    }

    if (!festivalForm.art_form.trim()) {
      return "Art form is required.";
    }

    if (!festivalForm.start_date.trim()) {
      return "Start date is required. Use YYYY-MM-DD.";
    }

    if (!festivalForm.end_date.trim()) {
      return "End date is required. Use YYYY-MM-DD.";
    }

    const latitude = numberOrNull(festivalForm.latitude);
    const longitude = numberOrNull(festivalForm.longitude);

    if (latitude === null || longitude === null) {
      return "Latitude and longitude must be valid numbers.";
    }

    return "";
  }

  function validateStreamForm() {
    if (streamMode !== "create" && !streamForm.id.trim()) {
      return "Enter or select a stream ID first.";
    }

    if (streamMode === "delete") {
      return "";
    }

    if (streamMode === "create" && !streamForm.festival_id.trim()) {
      return "Festival ID is required when creating a stream.";
    }

    if (!streamForm.title.trim()) {
      return "Stream title is required.";
    }

    if (!streamForm.url.trim()) {
      return "Stream URL is required.";
    }

    if (!streamForm.platform.trim()) {
      return "Platform is required, for example YouTube or Vimeo.";
    }

    if (!streamForm.category_id.trim()) {
      return "Category ID is required.";
    }

    if (numberOrNull(streamForm.category_id) === null) {
      return "Category ID must be a number.";
    }

    if (streamMode === "create" && numberOrNull(streamForm.festival_id) === null) {
      return "Festival ID must be a number.";
    }

    return "";
  }

  function buildFestivalPayload() {
    return {
      name: festivalForm.name.trim(),
      city: festivalForm.city.trim(),
      country: festivalForm.country.trim(),
      website: festivalForm.website.trim(),
      image_url: festivalForm.image_url.trim(),
      latitude: numberOrNull(festivalForm.latitude),
      longitude: numberOrNull(festivalForm.longitude),
      description: festivalForm.description.trim(),
      start_date: festivalForm.start_date.trim(),
      end_date: festivalForm.end_date.trim(),
      month: festivalForm.month.trim(),
      art_form: festivalForm.art_form.trim(),
      genres: csvToArray(festivalForm.genresCsv),
      images: csvToArray(festivalForm.imagesCsv),
    };
  }

  function buildStreamCreatePayload() {
    return {
      festival_id: numberOrNull(streamForm.festival_id),
      streams: [
        {
          title: streamForm.title.trim(),
          url: streamForm.url.trim(),
          platform: streamForm.platform.trim(),
          category_id: numberOrNull(streamForm.category_id),
        },
      ],
    };
  }

  function buildStreamUpdatePayload() {
    return {
      title: streamForm.title.trim(),
      url: streamForm.url.trim(),
      platform: streamForm.platform.trim(),
      category_id: numberOrNull(streamForm.category_id),
    };
  }

  async function submitFestival() {
    const validationError = validateFestivalForm();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    const shouldContinue =
      festivalMode === "delete"
        ? await confirmAction("Delete this festival from the database?")
        : true;

    if (!shouldContinue) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const id = festivalForm.id.trim();

      const url =
        festivalMode === "create"
          ? `${API_BASE_URL}/festivals/admin`
          : `${API_BASE_URL}/festivals/admin/${id}`;

      const response = await fetch(url, {
        method:
          festivalMode === "create"
            ? "POST"
            : festivalMode === "update"
              ? "PUT"
              : "DELETE",
        headers: authHeaders,
        body: festivalMode === "delete" ? undefined : JSON.stringify(buildFestivalPayload()),
      });

      const responseBody = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          typeof responseBody === "string"
            ? responseBody
            : responseBody?.message || `Request failed with status ${response.status}.`
        );
      }

      setMessage(
        festivalMode === "create"
          ? "Festival created successfully."
          : festivalMode === "update"
            ? "Festival updated successfully."
            : "Festival deleted successfully."
      );

      if (festivalMode !== "update") {
        setFestivalForm(emptyFestivalForm);
      }

      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Festival request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitStream() {
    const validationError = validateStreamForm();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    const shouldContinue =
      streamMode === "delete"
        ? await confirmAction("Delete this stream from the database?")
        : true;

    if (!shouldContinue) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const id = streamForm.id.trim();

      const url =
        streamMode === "create"
          ? `${API_BASE_URL}/streams/admin`
          : `${API_BASE_URL}/streams/admin/${id}`;

      const response = await fetch(url, {
        method:
          streamMode === "create" ? "POST" : streamMode === "update" ? "PUT" : "DELETE",
        headers: authHeaders,
        body:
          streamMode === "delete"
            ? undefined
            : JSON.stringify(
                streamMode === "create" ? buildStreamCreatePayload() : buildStreamUpdatePayload()
              ),
      });

      const responseBody = await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          typeof responseBody === "string"
            ? responseBody
            : responseBody?.message || `Request failed with status ${response.status}.`
        );
      }

      setMessage(
        streamMode === "create"
          ? "Stream created successfully."
          : streamMode === "update"
            ? "Stream updated successfully."
            : "Stream deleted successfully."
      );

      if (streamMode !== "update") {
        setStreamForm(emptyStreamForm);
      }

      await loadAdminData();
    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? error.message : "Stream request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isHydrating) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading admin session...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
        <View style={styles.pageShell}>
          <View style={styles.page}>
            <Text style={styles.eyebrow}>Admin</Text>
            <Text style={styles.title}>Admin access requires login</Text>
            <Text style={styles.subtitle}>
              Please log in before using the prototype admin section.
            </Text>

            <Link href="/login" asChild>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Log In</Text>
              </Pressable>
            </Link>
          </View>

          <Footer />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
      <View style={styles.pageShell}>
        <View style={styles.page}>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Admin</Text>
              <Text style={styles.title}>Admin Section</Text>
              <Text style={styles.subtitle}>
                Manage festival and stream records through the API. This is a prototype admin
                interface and should later be protected with real role-based access control.
              </Text>
            </View>

            <Pressable style={styles.refreshButton} onPress={loadAdminData}>
              <Feather name="refresh-cw" size={17} color={theme.colors.primary} />
              <Text style={styles.refreshButtonText}>
                {isLoadingData ? "Refreshing..." : "Refresh data"}
              </Text>
            </Pressable>
          </View>

          {message ? (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}

          <View style={styles.tabRow}>
            <Pressable
              style={[styles.tabButton, activeTab === "festivals" ? styles.tabButtonActive : null]}
              onPress={() => setActiveTab("festivals")}
            >
              <Feather
                name="map-pin"
                size={16}
                color={activeTab === "festivals" ? "#FFFFFF" : theme.colors.primary}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "festivals" ? styles.tabButtonTextActive : null,
                ]}
              >
                Festivals
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tabButton, activeTab === "streams" ? styles.tabButtonActive : null]}
              onPress={() => setActiveTab("streams")}
            >
              <Feather
                name="play-circle"
                size={16}
                color={activeTab === "streams" ? "#FFFFFF" : theme.colors.primary}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "streams" ? styles.tabButtonTextActive : null,
                ]}
              >
                Streams
              </Text>
            </Pressable>
          </View>

          {activeTab === "festivals" ? (
            <View style={[styles.adminGrid, isWide ? styles.adminGridWide : null]}>
              <View style={[styles.card, isWide ? styles.listCardWide : null]}>
                <Text style={styles.cardTitle}>Existing festivals</Text>
                <Text style={styles.cardText}>
                  Select a festival to pre-fill the update/delete form.
                </Text>

                {isLoadingData ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <View style={styles.recordList}>
                    {festivals.length === 0 ? (
                      <Text style={styles.emptyText}>No festivals loaded.</Text>
                    ) : (
                      festivals.map((festival) => {
                        const id = clean(festival.id);
                        const name = clean(festival.name) || "Untitled festival";
                        const location = [festival.city, festival.country]
                          .map(clean)
                          .filter(Boolean)
                          .join(", ");

                        return (
                          <Pressable
                            key={`${id}-${name}`}
                            style={styles.recordButton}
                            onPress={() => {
                              setFestivalMode("update");
                              setFestivalForm(festivalToForm(festival));
                              setMessage(`Selected festival ${id || name}.`);
                            }}
                          >
                            <Text style={styles.recordTitle}>{name}</Text>
                            <Text style={styles.recordMeta}>
                              ID: {id || "No ID"} {location ? `• ${location}` : ""}
                            </Text>
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                )}
              </View>

              <View style={[styles.card, isWide ? styles.formCardWide : null]}>
                <Text style={styles.cardTitle}>Festival form</Text>

                <View style={styles.modeRow}>
                  <ModeButton
                    label="Create"
                    active={festivalMode === "create"}
                    onPress={() => {
                      setFestivalMode("create");
                      setFestivalForm(emptyFestivalForm);
                    }}
                  />
                  <ModeButton
                    label="Update"
                    active={festivalMode === "update"}
                    onPress={() => setFestivalMode("update")}
                  />
                  <ModeButton
                    label="Delete"
                    active={festivalMode === "delete"}
                    onPress={() => setFestivalMode("delete")}
                  />
                </View>

                {festivalMode !== "create" ? (
                  <Field
                    label="Festival ID"
                    value={festivalForm.id}
                    onChangeText={(value) => updateFestivalField("id", value)}
                    placeholder="Example: 12"
                    keyboardType="numeric"
                    helper="Required for update and delete."
                  />
                ) : null}

                {festivalMode !== "delete" ? (
                  <>
                    <View style={styles.twoColumnFields}>
                      <Field
                        label="Name"
                        value={festivalForm.name}
                        onChangeText={(value) => updateFestivalField("name", value)}
                        placeholder="Festival name"
                      />
                      <Field
                        label="Art form"
                        value={festivalForm.art_form}
                        onChangeText={(value) => updateFestivalField("art_form", value)}
                        placeholder="Music, Film, Theatre..."
                      />
                    </View>

                    <View style={styles.twoColumnFields}>
                      <Field
                        label="City"
                        value={festivalForm.city}
                        onChangeText={(value) => updateFestivalField("city", value)}
                        placeholder="City"
                      />
                      <Field
                        label="Country"
                        value={festivalForm.country}
                        onChangeText={(value) => updateFestivalField("country", value)}
                        placeholder="Country"
                      />
                    </View>

                    <View style={styles.twoColumnFields}>
                      <Field
                        label="Start date"
                        value={festivalForm.start_date}
                        onChangeText={(value) => updateFestivalField("start_date", value)}
                        placeholder="YYYY-MM-DD"
                      />
                      <Field
                        label="End date"
                        value={festivalForm.end_date}
                        onChangeText={(value) => updateFestivalField("end_date", value)}
                        placeholder="YYYY-MM-DD"
                      />
                    </View>

                    <View style={styles.twoColumnFields}>
                      <Field
                        label="Month"
                        value={festivalForm.month}
                        onChangeText={(value) => updateFestivalField("month", value)}
                        placeholder="Example: May"
                      />
                      <Field
                        label="Website"
                        value={festivalForm.website}
                        onChangeText={(value) => updateFestivalField("website", value)}
                        placeholder="https://example.com"
                        keyboardType="url"
                      />
                    </View>

                    <View style={styles.twoColumnFields}>
                      <Field
                        label="Latitude"
                        value={festivalForm.latitude}
                        onChangeText={(value) => updateFestivalField("latitude", value)}
                        placeholder="Example: 51.5072"
                        keyboardType="numeric"
                      />
                      <Field
                        label="Longitude"
                        value={festivalForm.longitude}
                        onChangeText={(value) => updateFestivalField("longitude", value)}
                        placeholder="Example: -0.1276"
                        keyboardType="numeric"
                      />
                    </View>

                    <Field
                      label="Main image URL"
                      value={festivalForm.image_url}
                      onChangeText={(value) => updateFestivalField("image_url", value)}
                      placeholder="https://example.com/image.jpg"
                      keyboardType="url"
                    />

                    <Field
                      label="Description"
                      value={festivalForm.description}
                      onChangeText={(value) => updateFestivalField("description", value)}
                      placeholder="Short festival description"
                      multiline
                    />

                    <Field
                      label="Genres"
                      value={festivalForm.genresCsv}
                      onChangeText={(value) => updateFestivalField("genresCsv", value)}
                      placeholder="Music, Culture, Arts"
                      helper="Separate multiple genres with commas."
                    />

                    <Field
                      label="Additional images"
                      value={festivalForm.imagesCsv}
                      onChangeText={(value) => updateFestivalField("imagesCsv", value)}
                      placeholder="https://image1.jpg, https://image2.jpg"
                      helper="Separate multiple image URLs with commas."
                    />
                  </>
                ) : (
                  <Text style={styles.deleteWarning}>
                    Deleting will permanently remove the selected festival record if the backend
                    accepts the request.
                  </Text>
                )}

                <Pressable
                  style={[styles.submitButton, isSubmitting ? styles.disabledButton : null]}
                  onPress={submitFestival}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting
                      ? "Working..."
                      : festivalMode === "create"
                        ? "Create Festival"
                        : festivalMode === "update"
                          ? "Update Festival"
                          : "Delete Festival"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={[styles.adminGrid, isWide ? styles.adminGridWide : null]}>
              <View style={[styles.card, isWide ? styles.listCardWide : null]}>
                <Text style={styles.cardTitle}>Existing streams</Text>
                <Text style={styles.cardText}>
                  Select a stream to pre-fill the update/delete form.
                </Text>

                {isLoadingData ? (
                  <ActivityIndicator color={theme.colors.primary} />
                ) : (
                  <View style={styles.recordList}>
                    {streams.length === 0 ? (
                      <Text style={styles.emptyText}>No streams loaded.</Text>
                    ) : (
                      streams.map((stream) => {
                        const id = clean(stream.id);
                        const title = clean(stream.title) || "Untitled stream";
                        const festivalName = clean(stream.festival_name);
                        const platform = clean(stream.platform);

                        return (
                          <Pressable
                            key={`${id}-${title}`}
                            style={styles.recordButton}
                            onPress={() => {
                              setStreamMode("update");
                              setStreamForm(streamToForm(stream));
                              setMessage(`Selected stream ${id || title}.`);
                            }}
                          >
                            <Text style={styles.recordTitle}>{title}</Text>
                            <Text style={styles.recordMeta}>
                              ID: {id || "No ID"}
                              {platform ? ` • ${platform}` : ""}
                              {festivalName ? ` • ${festivalName}` : ""}
                            </Text>
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                )}
              </View>

              <View style={[styles.card, isWide ? styles.formCardWide : null]}>
                <Text style={styles.cardTitle}>Stream form</Text>

                <View style={styles.modeRow}>
                  <ModeButton
                    label="Create"
                    active={streamMode === "create"}
                    onPress={() => {
                      setStreamMode("create");
                      setStreamForm(emptyStreamForm);
                    }}
                  />
                  <ModeButton
                    label="Update"
                    active={streamMode === "update"}
                    onPress={() => setStreamMode("update")}
                  />
                  <ModeButton
                    label="Delete"
                    active={streamMode === "delete"}
                    onPress={() => setStreamMode("delete")}
                  />
                </View>

                {streamMode !== "create" ? (
                  <Field
                    label="Stream ID"
                    value={streamForm.id}
                    onChangeText={(value) => updateStreamField("id", value)}
                    placeholder="Example: 8"
                    keyboardType="numeric"
                    helper="Required for update and delete."
                  />
                ) : null}

                {streamMode !== "delete" ? (
                  <>
                    {streamMode === "create" ? (
                      <Field
                        label="Festival ID"
                        value={streamForm.festival_id}
                        onChangeText={(value) => updateStreamField("festival_id", value)}
                        placeholder="The festival this stream belongs to"
                        keyboardType="numeric"
                      />
                    ) : null}

                    <Field
                      label="Title"
                      value={streamForm.title}
                      onChangeText={(value) => updateStreamField("title", value)}
                      placeholder="Stream title"
                    />

                    <Field
                      label="URL"
                      value={streamForm.url}
                      onChangeText={(value) => updateStreamField("url", value)}
                      placeholder="https://youtube.com/..."
                      keyboardType="url"
                    />

                    <View style={styles.twoColumnFields}>
                      <Field
                        label="Platform"
                        value={streamForm.platform}
                        onChangeText={(value) => updateStreamField("platform", value)}
                        placeholder="YouTube"
                      />
                      <Field
                        label="Category ID"
                        value={streamForm.category_id}
                        onChangeText={(value) => updateStreamField("category_id", value)}
                        placeholder="Example: 1"
                        keyboardType="numeric"
                      />
                    </View>
                  </>
                ) : (
                  <Text style={styles.deleteWarning}>
                    Deleting will permanently remove the selected stream record if the backend
                    accepts the request.
                  </Text>
                )}

                <Pressable
                  style={[styles.submitButton, isSubmitting ? styles.disabledButton : null]}
                  onPress={submitStream}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting
                      ? "Working..."
                      : streamMode === "create"
                        ? "Create Stream"
                        : streamMode === "update"
                          ? "Update Stream"
                          : "Delete Stream"}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <Footer />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: "700",
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

  headerRow: {
    gap: 16,
    marginBottom: 18,
  },

  headerCopy: {
    flex: 1,
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
    maxWidth: 860,
  },

  subtitle: {
    color: theme.colors.textMuted,
    marginTop: 12,
    fontSize: 16,
    lineHeight: 26,
    maxWidth: 860,
  },

  refreshButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },

  refreshButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },

  messageBox: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },

  messageText: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },

  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },

  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
  },

  tabButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  tabButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },

  tabButtonTextActive: {
    color: "#FFFFFF",
  },

  adminGrid: {
    gap: 18,
  },

  adminGridWide: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 18,
  },

  listCardWide: {
    width: "34%",
  },

  formCardWide: {
    flex: 1,
  },

  cardTitle: {
    color: theme.colors.primary,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
    marginBottom: 8,
  },

  cardText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },

  modeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },

  modeButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },

  modeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },

  modeButtonText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },

  modeButtonTextActive: {
    color: "#FFFFFF",
  },

  fieldWrap: {
    flex: 1,
    marginBottom: 14,
  },

  fieldLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 7,
  },

  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: theme.colors.text,
    fontSize: 15,
    minHeight: 46,
  },

  multilineInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },

  fieldHelper: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },

  twoColumnFields: {
    gap: 12,
  },

  recordList: {
    gap: 10,
  },

  recordButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 12,
  },

  recordTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 4,
  },

  recordMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },

  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },

  deleteWarning: {
    color: "#9F1239",
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
    borderRadius: 16,
    padding: 14,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "800",
    marginBottom: 14,
  },

  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.6,
  },

  primaryButton: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 20,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },
});