import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Callout, Marker, Region } from "react-native-maps";

import type { FestivalMapProps } from "./FestivalMap.types";

function getRegionForFestivals(
  festivals: FestivalMapProps["festivals"]
): Region {
  if (festivals.length === 0) {
    return {
      latitude: 20,
      longitude: 0,
      latitudeDelta: 80,
      longitudeDelta: 80,
    };
  }

  if (festivals.length === 1) {
    return {
      latitude: festivals[0].latitude,
      longitude: festivals[0].longitude,
      latitudeDelta: 8,
      longitudeDelta: 8,
    };
  }

  const latitudes = festivals.map((festival) => festival.latitude);
  const longitudes = festivals.map((festival) => festival.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;

  const latitudeDelta = Math.max((maxLat - minLat) * 1.5, 8);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.5, 8);

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
}

export default function FestivalMapNative({
  festivals,
  selectedCountry,
}: FestivalMapProps) {
  const mapRef = useRef<MapView | null>(null);

  const region = useMemo(() => getRegionForFestivals(festivals), [festivals]);

  useEffect(() => {
    if (!mapRef.current || festivals.length === 0) return;
    mapRef.current.animateToRegion(region, 500);
  }, [festivals, region]);

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

  return (
    <View style={styles.mapWrap}>
      <MapView ref={mapRef} style={styles.map} initialRegion={region}>
        {festivals.map((festival) => (
          <Marker
            key={`${festival.id}-${festival.name}`}
            coordinate={{
              latitude: festival.latitude,
              longitude: festival.longitude,
            }}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{festival.name}</Text>
                <Text style={styles.calloutText}>
                  {festival.city || "City unknown"}
                </Text>
                <Text style={styles.calloutText}>{festival.country}</Text>
                <Text style={styles.calloutText}>
                  {festival.artForm || "Art form unknown"}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    flex: 1,
    minHeight: 320,
    borderRadius: 14,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
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
  callout: {
    width: 180,
    paddingVertical: 4,
  },
  calloutTitle: {
    fontWeight: "800",
    color: "#222",
    marginBottom: 4,
  },
  calloutText: {
    color: "#555",
    fontSize: 12,
  },
});