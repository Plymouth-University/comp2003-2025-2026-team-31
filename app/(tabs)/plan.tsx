import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function PlanScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Plan</Text>
      <Text style={styles.text}>
        This is a placeholder page for the future planning features.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b0b0f",
    padding: 24,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
  },
  text: {
    color: "#cfcfcf",
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
  },
});