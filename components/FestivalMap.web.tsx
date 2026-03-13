import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { FestivalMapProps } from "./FestivalMap.types";

type ReactLeafletModule = typeof import("react-leaflet");
type LeafletModule = typeof import("leaflet");

function LeafletMapInner({
  festivals,
  reactLeaflet,
  leaflet,
}: {
  festivals: FestivalMapProps["festivals"];
  reactLeaflet: ReactLeafletModule;
  leaflet: LeafletModule;
}) {
  const { MapContainer, TileLayer, CircleMarker, Popup, useMap } = reactLeaflet;

  function FitBounds({
    items,
  }: {
    items: FestivalMapProps["festivals"];
  }) {
    const map = useMap();

    useEffect(() => {
      if (items.length === 0) return;

      if (items.length === 1) {
        map.setView([items[0].latitude, items[0].longitude], 6);
        return;
      }

      const bounds = leaflet.latLngBounds(
        items.map(
          (festival) => [festival.latitude, festival.longitude] as [number, number]
        )
      );

      map.fitBounds(bounds.pad(0.25));
    }, [items, map]);

    return null;
  }

  const center = useMemo<[number, number]>(() => {
    if (festivals.length === 0) return [20, 0];
    return [festivals[0].latitude, festivals[0].longitude];
  }, [festivals]);

  return (
    <MapContainer
      center={center}
      zoom={3}
      scrollWheelZoom
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds items={festivals} />

      {festivals.map((festival) => (
        <CircleMarker
          key={`${festival.id}-${festival.name}`}
          center={[festival.latitude, festival.longitude]}
          radius={8}
          pathOptions={{
            color: "#6f3a83",
            fillColor: "#6f3a83",
            fillOpacity: 0.8,
            weight: 2,
          }}
        >
          <Popup>
            <div>
              <strong>{festival.name}</strong>
              <br />
              {festival.city || "City unknown"}
              <br />
              {festival.country}
              <br />
              {festival.artForm || "Art form unknown"}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

export default function FestivalMap({
  festivals,
  selectedCountry,
}: FestivalMapProps) {
  const [mounted, setMounted] = useState(false);
  const [reactLeaflet, setReactLeaflet] = useState<ReactLeafletModule | null>(null);
  const [leaflet, setLeaflet] = useState<LeafletModule | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;

    async function loadMapLibraries() {
      try {
        const [reactLeafletModule, leafletModule] = await Promise.all([
          import("react-leaflet"),
          import("leaflet"),
        ]);

        if (!cancelled) {
          setReactLeaflet(reactLeafletModule);
          setLeaflet(leafletModule);
        }
      } catch (error) {
        console.error("Failed to load web map libraries:", error);
      }
    }

    loadMapLibraries();

    return () => {
      cancelled = true;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const existingLink = document.getElementById("leaflet-css");
    if (existingLink) return;

    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }, [mounted]);

  if (!mounted) {
    return <View style={styles.loadingBox} />;
  }

  if (festivals.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>No mappable festivals</Text>
        <Text style={styles.emptyText}>
          {selectedCountry
            ? `No festivals with valid coordinates were found for ${selectedCountry}.`
            : "No festivals with valid coordinates are available for the current filters."}
        </Text>
      </View>
    );
  }

  if (!reactLeaflet || !leaflet) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Loading map…</Text>
        <Text style={styles.emptyText}>
          Preparing the interactive web map.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mapWrap}>
      <LeafletMapInner
        festivals={festivals}
        reactLeaflet={reactLeaflet}
        leaflet={leaflet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    minHeight: 320,
    borderRadius: 14,
    overflow: "hidden",
  },
  loadingBox: {
    minHeight: 320,
    borderRadius: 14,
    backgroundColor: "#ece7ef",
  },
  emptyWrap: {
    minHeight: 320,
    borderRadius: 14,
    backgroundColor: "#ece7ef",
    borderWidth: 1,
    borderColor: "#ddd3e3",
    padding: 20,
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#55286f",
    fontSize: 22,
    fontWeight: "900",
  },
  emptyText: {
    marginTop: 10,
    color: "#755c82",
    lineHeight: 22,
  },
});
