import React from "react";
import { Platform } from "react-native";

import type { FestivalMapProps } from "./FestivalMap.types";

const FestivalMapImpl =
  Platform.OS === "web"
    ? require("./FestivalMap.web").default
    : require("./FestivalMap.native").default;

export default function FestivalMap(props: FestivalMapProps) {
  return <FestivalMapImpl {...props} />;
}