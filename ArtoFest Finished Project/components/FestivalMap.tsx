import React from "react";
import { Platform } from "react-native";

import FestivalMapNative from "./FestivalMap.native";
import type { FestivalMapProps } from "./FestivalMap.types";
import FestivalMapWeb from "./FestivalMap.web";

export default function FestivalMap(props: FestivalMapProps) {
  if (Platform.OS === "web") {
    return <FestivalMapWeb {...props} />;
  }

  return <FestivalMapNative {...props} />;
}